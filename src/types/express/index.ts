// types/express/index.ts (not .d.ts — use normal ts file)

import { Request } from "express";
type MulterFile = Express.Multer.File;

// Define the shape of expected body
interface PostBody {
  title: string;
  description: string;
}

export interface AuthenticatedRequest
  extends Request<
    Record<string, any>, // params
    any, // res body
    PostBody // req.body
  > {
  userId: string;
  files?: MulterFile[];
}
