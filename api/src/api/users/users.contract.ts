import { Router } from "express";
import {
  listUsersHandler,
  getUserHandler,
  createUserHandler,
  upsertUserHandler,
  updateUserHandler,
  deleteUserHandler,
} from "./users.handler";

export const usersRouter = Router();

usersRouter.get("/", listUsersHandler);
usersRouter.get("/:email", getUserHandler);
usersRouter.post("/", createUserHandler);
usersRouter.put("/:email", updateUserHandler);
usersRouter.post("/upsert", upsertUserHandler);
usersRouter.delete("/:email", deleteUserHandler);

export default usersRouter;
