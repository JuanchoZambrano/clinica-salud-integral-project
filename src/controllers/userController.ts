import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import {
  findExistingUserModel,
  findRoleByNameModel,
  createUserModel,
  getUsersModel,
  findUserByIdModel,
  findDuplicateUserModel,
  updateUserModel,
  findUserWithRoleModel,
  updateUserStatusModel,
} from "../models/userModel.js";
import {
  createUserSchema,
  updateUserSchema,
  updateUserStatusSchema,
} from "../schemas/userSchema.js";

export async function createUser(req: Request, res: Response) {
  /*
    #swagger.tags = ['Users']
    #swagger.summary = 'Crear un usuario'
    #swagger.description = 'Permite registrar MANAGER y RECEPTIONIST. Solo ADMIN puede realizar esta acción.'
    #swagger.parameters['body'] = {
      in: 'body',
      description: 'Cuerpo para crear un nuevo usuario',
      required: true,
      schema: {
        userName: "",
        userEmail: "",
        password: "",
        roleName: ""
      }
    }
    #swagger.security = [{
      "bearerAuth": []
    }]
  */

  try {
    const validation = createUserSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        ok: false,
        message: "Datos de usuario inválidos.",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { userName, userEmail, password, roleName } = validation.data;

    const existingUser = await findExistingUserModel(userName, userEmail);

    if (existingUser) {
      return res.status(409).json({
        ok: false,
        message: "El nombre de usuario o correo electrónico ya existe.",
      });
    }

    const findRole = await findRoleByNameModel(roleName);

    if (!findRole) {
      return res.status(404).json({
        ok: false,
        message: "El rol indicado no existe.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await createUserModel({
      userName,
      userEmail,
      hashedPassword,
      roleId: findRole.id,
    });

    return res.status(201).json({
      ok: true,
      message: "Usuario creado exitosamente.",
      data: newUser,
    });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno del servidor.",
    });
  }
}

export async function getUsers(req: Request, res: Response) {
  /*
    #swagger.tags = ['Users']
    #swagger.summary = 'Listar usuarios'
    #swagger.description = 'Permite consultar todos los usuarios registrados, sus roles y estados. Solo ADMIN puede realizar esta acción.'
    #swagger.security = [{
      "bearerAuth": []
    }]
  */

  try {
    const users = await getUsersModel();

    return res.status(200).json({
      ok: true,
      data: users,
    });
  } catch (error) {
    console.error("Error al consultar usuarios:", error);

    return res.status(500).json({
      ok: false,
      message: "Error interno del servidor.",
    });
  }
}

export async function updateUser(req: Request, res: Response) {
  /*
    #swagger.tags = ['Users']
    #swagger.summary = 'Actualizar usuario'
    #swagger.description = 'Permite actualizar los datos de un recepcionista o gerente. Solo ADMIN puede realizar esta acción.'
    #swagger.parameters['body'] = {
      in: 'body',
      description: 'Replace - userName, userEmail, password, roleName',
      required: true,
      schema: {
        replace: ""
      }
    }
    #swagger.security = [{
      "bearerAuth": []
    }]
  */

  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        ok: false,
        message: "ID de usuario inválido.",
      });
    }

    const validation = updateUserSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        ok: false,
        message: "Datos de usuario inválidos.",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { userName, userEmail, password, roleName } = validation.data;

    if (Object.keys(validation.data).length === 0) {
      return res.status(400).json({
        ok: false,
        message: "Debes proporcionar al menos un campo para actualizar.",
      });
    }

    const existingUser = await findUserByIdModel(userId);

    if (!existingUser) {
      return res.status(404).json({
        ok: false,
        message: "Usuario no encontrado.",
      });
    }

    if (!["RECEPTIONIST", "MANAGER"].includes(existingUser.role.roleName)) {
      return res.status(403).json({
        ok: false,
        message: "No puedes modificar los datos de este usuario.",
      });
    }

    if (userName || userEmail) {
      const duplicateUser = await findDuplicateUserModel(
        userId,
        userName,
        userEmail,
      );

      if (duplicateUser) {
        return res.status(409).json({
          ok: false,
          message: "El nombre de usuario o correo electrónico ya existe.",
        });
      }
    }

    let roleId: number | undefined;

    if (roleName) {
      const role = await findRoleByNameModel(roleName);

      if (!role) {
        return res.status(404).json({
          ok: false,
          message: "El rol indicado no existe.",
        });
      }
      roleId = role.id;
    }

    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : undefined;

    const updatedUser = await updateUserModel(userId, {
      userName,
      userEmail,
      hashedPassword,
      roleId,
    });

    return res.status(200).json({
      ok: true,
      message: "Usuario actualizado exitosamente.",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);

    return res.status(500).json({
      ok: false,
      message: "Error interno del servidor.",
    });
  }
}

export async function updateUserStatus(req: Request, res: Response) {
  /*
    #swagger.tags = ['Users']
    #swagger.summary = 'Activar o desactivar usuario'
    #swagger.description = 'Permite activar o desactivar los estados de los usuarios. Solo ADMIN puede realizar esta acción.'
    #swagger.parameters['body'] = {
      in: 'body',
      description: 'Activar o desactivar usuarios.',
      required: true,
      schema: {
        status: false
      }
    }
    #swagger.security = [{
      "bearerAuth": []
    }]
  */

  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        ok: false,
        message: "ID de usuario inválido.",
      });
    }

    const validation = updateUserStatusSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        ok: false,
        message: "Debes proporcionar un estado válido.",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const existingUser = await findUserWithRoleModel(userId);

    if (!existingUser) {
      return res.status(404).json({
        ok: false,
        message: "Usuario no encontrado.",
      });
    }

    if (!["RECEPTIONIST", "MANAGER"].includes(existingUser.role.roleName)) {
      return res.status(403).json({
        ok: false,
        message: "No puedes modificar el estado de este usuario.",
      });
    }

    const updatedUser = await updateUserStatusModel(
      userId,
      validation.data.status,
    );

    return res.status(200).json({
      ok: true,
      message: "Estado del usuario actualizado exitosamente.",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error al actualizar estado del usuario:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno del servidor.",
    });
  }
}
