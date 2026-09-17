import "express";

declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        firebase_uid: string;
        email?: string | null;
        full_name: string;
        profile_picture?: string;
        role?: string;
        branch_id: null | string;
      };

      firebaseUser: {
        uid: string;
        email?: string;
      };
    }
  }
}