import { assertSupabaseConfigured, supabase } from "@/lib/supabase";
import { sanitizeFileName } from "@/lib/utils";
import type { MedicalStudy, NutritionPlan, StudyFileType } from "@/types/domain";

const NUTRITION_PLANS_BUCKET = "nutrition-plans";
const MEDICAL_STUDIES_BUCKET = "medical-studies";

type UploadStatusHandler = (status: string | null) => void;

interface ProcessAndUploadParams {
  bucketName: string;
  clinicId: string;
  patientId: string;
  type: "plan" | "study";
  file: File;
  onStatusChange?: UploadStatusHandler;
}

function mapNutritionPlan(row: any): NutritionPlan {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    patientId: row.patient_id,
    title: row.title,
    effectiveDate: row.effective_date,
    storagePath: row.storage_path,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at,
  };
}

function mapMedicalStudy(row: any): MedicalStudy {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    patientId: row.patient_id,
    title: row.title,
    studyDate: row.study_date,
    fileType: row.file_type,
    storagePath: row.storage_path,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at,
  };
}

function buildStoragePath(
  clinicId: string,
  patientId: string,
  type: "plan" | "study",
  fileName: string,
) {
  return `${clinicId}/${patientId}/${type}/${Date.now()}-${sanitizeFileName(fileName)}`;
}

function getStudyFileType(file: File): StudyFileType {
  if (file.type.startsWith("image/")) return "image";
  return "pdf";
}

async function uploadToBucket(bucketName: string, storagePath: string, file: File) {
  const { error } = await supabase.storage.from(bucketName).upload(storagePath, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    throw error;
  }
}

async function removeFromBucket(bucketName: string, storagePath: string) {
  const { error } = await supabase.storage.from(bucketName).remove([storagePath]);

  if (error) {
    throw error;
  }
}

async function compressPdf(file: File, onStatusChange?: UploadStatusHandler) {
  onStatusChange?.("Comprimiendo PDF...");

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/compress-pdf", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("No pudimos comprimir el PDF.");
  }

  const blob = await response.blob();

  return new File([blob], file.name, {
    type: "application/pdf",
  });
}

export async function processAndUpload({
  bucketName,
  clinicId,
  patientId,
  type,
  file,
  onStatusChange,
}: ProcessAndUploadParams) {
  assertSupabaseConfigured();

  let finalFile = file;

  try {
    if (file.type === "application/pdf") {
      finalFile = await compressPdf(file, onStatusChange);
    }

    onStatusChange?.("Subiendo archivo...");

    const storagePath = buildStoragePath(clinicId, patientId, type, file.name);
    await uploadToBucket(bucketName, storagePath, finalFile);

    return {
      file: finalFile,
      storagePath,
    };
  } finally {
    onStatusChange?.(null);
  }
}

export async function listNutritionPlans(patientId: string) {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("nutrition_plans")
    .select("*")
    .eq("patient_id", patientId)
    .order("effective_date", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapNutritionPlan);
}

export async function uploadNutritionPlan(
  clinicId: string,
  patientId: string,
  profileId: string,
  file: File,
  onStatusChange?: UploadStatusHandler,
) {
  assertSupabaseConfigured();

  const { file: finalFile, storagePath } = await processAndUpload({
    bucketName: NUTRITION_PLANS_BUCKET,
    clinicId,
    patientId,
    type: "plan",
    file,
    onStatusChange,
  });

  const title = file.name.replace(/\.[^.]+$/, "");

  const { data, error } = await supabase
    .from("nutrition_plans")
    .insert({
      clinic_id: clinicId,
      patient_id: patientId,
      title,
      effective_date: new Date().toISOString().slice(0, 10),
      storage_path: storagePath,
      file_name: file.name,
      mime_type: finalFile.type || "application/pdf",
      size_bytes: finalFile.size,
      uploaded_by: profileId,
    })
    .select("*")
    .single();

  if (error) {
    await removeFromBucket(NUTRITION_PLANS_BUCKET, storagePath);
    throw error;
  }

  return mapNutritionPlan(data);
}

export async function getNutritionPlanDownloadUrl(storagePath: string) {
  assertSupabaseConfigured();

  const { data, error } = await supabase.storage
    .from(NUTRITION_PLANS_BUCKET)
    .createSignedUrl(storagePath, 60);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

export async function deleteNutritionPlan(planId: string, storagePath: string) {
  assertSupabaseConfigured();

  await removeFromBucket(NUTRITION_PLANS_BUCKET, storagePath);

  const { error } = await supabase.from("nutrition_plans").delete().eq("id", planId);

  if (error) {
    throw error;
  }
}

export async function listMedicalStudies(patientId: string) {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("medical_studies")
    .select("*")
    .eq("patient_id", patientId)
    .order("study_date", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapMedicalStudy);
}

export async function uploadMedicalStudy(
  clinicId: string,
  patientId: string,
  profileId: string,
  file: File,
  onStatusChange?: UploadStatusHandler,
) {
  assertSupabaseConfigured();

  const { file: finalFile, storagePath } = await processAndUpload({
    bucketName: MEDICAL_STUDIES_BUCKET,
    clinicId,
    patientId,
    type: "study",
    file,
    onStatusChange,
  });

  const title = file.name.replace(/\.[^.]+$/, "");

  const { data, error } = await supabase
    .from("medical_studies")
    .insert({
      clinic_id: clinicId,
      patient_id: patientId,
      title,
      study_date: new Date().toISOString().slice(0, 10),
      file_type: getStudyFileType(finalFile),
      storage_path: storagePath,
      file_name: file.name,
      mime_type: finalFile.type || "application/octet-stream",
      size_bytes: finalFile.size,
      uploaded_by: profileId,
    })
    .select("*")
    .single();

  if (error) {
    await removeFromBucket(MEDICAL_STUDIES_BUCKET, storagePath);
    throw error;
  }

  return mapMedicalStudy(data);
}

export async function getMedicalStudyDownloadUrl(storagePath: string) {
  assertSupabaseConfigured();

  const { data, error } = await supabase.storage
    .from(MEDICAL_STUDIES_BUCKET)
    .createSignedUrl(storagePath, 60);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

export async function deleteMedicalStudy(studyId: string, storagePath: string) {
  assertSupabaseConfigured();

  await removeFromBucket(MEDICAL_STUDIES_BUCKET, storagePath);

  const { error } = await supabase.from("medical_studies").delete().eq("id", studyId);

  if (error) {
    throw error;
  }
}
