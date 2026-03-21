import { ReactNode } from "react";
import AppSidebar from "@/components/AppSidebar";
import MobileNav from "@/components/MobileNav";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen w-full bg-background md:flex">
      <AppSidebar />
      <MobileNav />
      <main className="min-w-0 flex-1 border-t border-border/70 md:border-l md:border-t-0">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
