import type {
  ReactNode,
} from "react";

import AdminSidebar from "../../pages/Admin/components/AdminSidebar";


interface AdminLayoutProps {
  children: ReactNode;
}


export default function AdminLayout({
  children,
}: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-50">

      <AdminSidebar />

      <main className="min-h-screen lg:pl-72">

        <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

          {children}

        </div>

      </main>

    </div>
  );
}