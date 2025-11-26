import { useState } from "react";
import { LockClosedIcon } from "@heroicons/react/24/solid";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { parseResumeFromPdf } from "lib/parse-resume-from-pdf";
import { getHasUsedAppBefore, saveStateToLocalStorage } from "lib/redux/local-storage";
import { type ShowForm, initialSettings } from "lib/redux/settingsSlice";
import { useRouter } from "next/navigation";
import addPdfSrc from "public/assets/add-pdf.svg";
import Image from "next/image";
import { cx } from "lib/cx";
import { deepClone } from "lib/deep-clone";

const defaultFileState = { name: "", size: 0, fileUrl: "" };

export const ResumeDropzone = ({
  onFileUrlChange,
  className = "",
  playgroundView = false,
}: {
  onFileUrlChange: (fileUrl: string) => void;
  className?: string;
  playgroundView?: boolean;
}) => {
  const [file, setFile] = useState(defaultFileState);
  const [isHoveredOnDropzone, setIsHoveredOnDropzone] = useState(false);
  const [hasNonPdfFile, setHasNonPdfFile] = useState(false);
  const router = useRouter();

  const hasFile = Boolean(file.name);

  const setNewFile = (newFile: File) => {
    if (file.fileUrl) URL.revokeObjectURL(file.fileUrl);
    const { name, size } = newFile;
    const fileUrl = URL.createObjectURL(newFile);
    setFile({ name, size, fileUrl });
    onFileUrlChange(fileUrl);
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const newFile = event.dataTransfer.files[0];
    if (newFile) {
      if (newFile.name.toLowerCase().endsWith(".pdf")) {
        setHasNonPdfFile(false);
        setNewFile(newFile);
      } else {
        setHasNonPdfFile(true);
      }
    }
    setIsHoveredOnDropzone(false);
  };

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !files[0]) return;
    setNewFile(files[0]);
  };

  const onRemove = () => {
    setFile(defaultFileState);
    onFileUrlChange("");
  };

  const onImportClick = async () => {
    const resume = await parseResumeFromPdf(file.fileUrl);
    const settings = deepClone(initialSettings);
    if (getHasUsedAppBefore()) {
      const sections = Object.keys(settings.formToShow) as ShowForm[];
      const sectionToFormToShow: Record<ShowForm, boolean> = {
        workExperiences: resume.workExperiences.length > 0,
        educations: resume.educations.length > 0,
        projects: resume.projects.length > 0,
        skills: resume.skills.descriptions.length > 0,
        custom: resume.custom.descriptions.length > 0,
      };
      for (const section of sections) {
        settings.formToShow[section] = sectionToFormToShow[section];
      }
    }
    saveStateToLocalStorage({ resume, settings });
    router.push("/resume-builder");
  };

  return (
    <div
      className={cx(
        "flex justify-center rounded-md border-2 border-dashed px-6 bg-card",
        isHoveredOnDropzone ? "border-blue-500" : "border-gray-300",
        playgroundView ? "pb-6 pt-4" : "py-12",
        className
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setIsHoveredOnDropzone(true);
      }}
      onDragLeave={() => setIsHoveredOnDropzone(false)}
      onDrop={onDrop}
      role="button"
      aria-label="Resume PDF dropzone"
    >
      <div className={cx("text-center", playgroundView ? "space-y-2" : "space-y-3")}>
        {!playgroundView && (
          <Image src={addPdfSrc} className="mx-auto h-14 w-14" alt="Add pdf" priority />
        )}
        {!hasFile ? (
          <>
            <p className={cx("pt-3 text-primary-fg", !playgroundView && "text-lg font-semibold")}>Browse a pdf file or drop it here</p>
            <p className="flex justify-center text-sm text-secondary-fg">
              <LockClosedIcon className="mr-1 mt-0.5 h-4 w-4 text-tertiary-fg" />
              File data is used locally and never leaves your browser
            </p>
          </>
        ) : (
          <div className="flex items-center justify-center gap-3 pt-3">
            <div className="pl-2 font-semibold text-primary-fg truncate max-w-[16rem]" title={file.name}>
              {file.name} – {getFileSizeString(file.size)}
            </div>
            <button
              type="button"
              className="outline-theme-blue rounded-md p-1 text-tertiary-fg hover:bg-input hover:text-secondary-fg"
              title="Remove file"
              onClick={onRemove}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="pt-4">
          {!hasFile ? (
            <>
              <label
                className={cx(
                  "within-outline-theme-purple cursor-pointer rounded-full px-6 pb-2.5 pt-2 font-semibold shadow-sm",
                  playgroundView ? "border" : "bg-primary"
                )}
              >
                Browse file
                <input type="file" className="sr-only" accept=".pdf" onChange={onInputChange} />
              </label>
              {hasNonPdfFile && <p className="mt-6 text-red-500">Only PDF files are supported</p>}
            </>
          ) : (
            <>
              {!playgroundView && (
                <button type="button" className="btn-primary" onClick={onImportClick}>
                  Import and Continue <span aria-hidden="true">→</span>
                </button>
              )}
              <p className={cx("text-secondary-fg", !playgroundView && "mt-6")}>Note: {!playgroundView ? "Import" : "Parser"} works best on single-column resumes</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const getFileSizeString = (fileSizeB: number) => {
  const fileSizeKB = fileSizeB / 1024;
  if (fileSizeKB < 1000) return fileSizeKB.toPrecision(3) + " KB";
  const fileSizeMB = fileSizeKB / 1024;
  return fileSizeMB.toPrecision(3) + " MB";
};
