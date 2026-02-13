import { defineStorage } from "@aws-amplify/backend";

export const storage = defineStorage({
  name: "weddingPhotos",
  access: (allow) => ({
    "photos/*": [
      allow.authenticated.to(["read", "write", "delete"]),
    ],
  }),
});
