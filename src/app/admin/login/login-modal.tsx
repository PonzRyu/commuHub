"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoginFormInModal } from "./login-form";

export function AdminLoginModal({
  nextPath,
  appDisplayName,
}: {
  nextPath: string;
  appDisplayName: string;
}) {
  const router = useRouter();

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) router.replace("/");
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{appDisplayName} 管理者ログイン</DialogTitle>
        </DialogHeader>
        <LoginFormInModal nextPath={nextPath} />
      </DialogContent>
    </Dialog>
  );
}

