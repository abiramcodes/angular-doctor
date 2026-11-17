import { bootstrapApplication } from '@angular/platform-browser';
import { PostReader } from './app/post-reader';

bootstrapApplication(PostReader).catch((error: unknown) => console.error(error));
