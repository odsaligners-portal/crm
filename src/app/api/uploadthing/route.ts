import { createUploadthing, type FileRouter } from "uploadthing/server";
import { createRouteHandler } from "uploadthing/next";
import { z } from "zod";

const f = createUploadthing();

export const fileRouter = {
  patientFiles: f({
    image: { maxFileSize: "8MB" },
    pdf: { maxFileSize: "64MB" },
    text: { maxFileSize: "2MB" },
  })
    .input(z.object({ patientId: z.string() }))
    .onUploadComplete(async ({ file }) => {
      // You can store file info in your DB here if needed
      return { url: file.url, name: file.name, key: file.key };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof fileRouter;

export const { POST } = createRouteHandler({ router: fileRouter });

