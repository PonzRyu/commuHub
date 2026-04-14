import { APP_DISPLAY_NAME_SUFFIX } from "@/lib/app-display-constants";
import { APP_VERSION } from "@/lib/app-version";

export function DeveloperFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="border-border/60 bg-background mt-auto border-t py-2"
      aria-label="開発者情報"
    >
      <div className="text-muted-foreground mx-auto flex max-w-[1200px] items-end justify-center px-4">
        <div className="flex min-w-0 flex-1 justify-start">
          <p
            className="text-muted-foreground/90 shrink-0 font-mono text-[11px] tracking-wide"
            aria-label={`${APP_DISPLAY_NAME_SUFFIX} のバージョン ${APP_VERSION}`}
          >
            {APP_DISPLAY_NAME_SUFFIX} v{APP_VERSION}
          </p>
        </div>
        <div className="mx-auto min-w-0 max-w-full shrink text-center">
          <p className="mb-0.5 text-[10px] font-medium tracking-[0.28em] uppercase">
            Developer
          </p>
          <p className="text-foreground text-sm font-semibold leading-tight tracking-tight">
            PonzRyu
          </p>
          <nav
            className="mt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-xs"
            aria-label="リンク"
          >
            <a
              href="https://github.com/PonzRyu/commuHub"
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              GitHub
            </a>
            <a
              href="mailto:ryu.ponz.dev.0112@gmail.com"
              className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              お問い合わせ
            </a>
          </nav>
        </div>
        <div className="flex min-w-0 flex-1 justify-end">
          <p className="text-muted-foreground/90 shrink-0 font-mono text-[11px] tracking-wide">
            © {year} PonzRyu
          </p>
        </div>
      </div>
    </footer>
  );
}
