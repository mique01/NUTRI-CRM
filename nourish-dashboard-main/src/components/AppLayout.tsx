import { ReactNode } from "react";
import AppSidebar from "@/components/AppSidebar";
import MobileNav from "@/components/MobileNav";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row w-full">
      <AppSidebar />
      <MobileNav />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
};

export default AppLayout;
