import { validationResult } from "express-validator";
import { verifiedaccess } from "googleapis/build/src/apis/verifiedaccess";
import * as jwt from "jsonwebtoken";
import { Error } from "mongoose";
import roles from "../src/user/role"

export class GlobalMiddleWare {
  static checkError(req, res, next) {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      console.log({ error: error.array() });
      next(res.json({ error: error.array() }));
    } else {
      next();
    }
  }

  static async authenticate(req: any, res: any, next: any) {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader) {
        const token = await authHeader.split(" ")[1];
        const verify = await jwt.verify(
          token,
          process.env.SECRET_KEY,
          (err, decoded) => {
            if (err) {
              next(err);
            } else if (!decoded) {
              req.errorStatus = 401;
              next(new Error("User Not Authorised"));
            } else {
              req.user = decoded;

              next();
            }
          }
        );
      } else {
        res.send({ message: "jwt not provided" });
      }
    } catch (error) {
      res.send({ message: "Middleware not working" });
      req.errorStatus = 401;
      console.log(error, "error");
      next(error);
    }
  }

  // static async authorization(req, res, next) {
  //   try {
  //     const authHeader = req.headers.authorization;
  //     if (authHeader) {
  //       const token = await authHeader.split(" ")[1];
  //       const verify = await jwt.verify(
  //         token,
  //         process.env.SECRET_KEY,
  //         (err, decoded) => {
  //           if (err) {
  //             next(err);
  //           } else if (!decoded) {
  //             req.errorStatus = 401;
  //             next(new Error("User Not Authorised"));
  //           } else {
  //             var user = decoded.role;
  //             console.log("userRole---->", user);
  //             switch (user) {
  //               case "SuperAdmin":
  //                 req.superAdmin = decoded;
  //                 if (req.superAdmin) {
  //                   console.log(req.superAdmin, "you will get full access");
  //                 } else {
  //                   console.log(req.superAdmin, "NOT ALLOWED");
  //                 }
  //                 break;

  //               case "Admin":
  //                 req.Admin = decoded;

  //                 if (req.Admin) {
  //                   console.log(req.Admin, "you will get mid level access");
  //                 } else {
  //                   console.log(req.Admin, "NOT ALLOWED");
  //                 }
  //                 break;

  //               case "Employee":
  //                 req.Employee = decoded;

  //                 if (req.Employee) {
  //                   console.log(req.Employee, "you will get limited access");
  //                 } else {
  //                   console.log(req.Employee, "NOT ALLOWED");
  //                 }

  //                 break;

  //               default:
  //                 break;
  //             }
  //             next();
  //           }
  //         }
  //       );
  //     } else {
  //       res.send({ message: "jwt not provided" });
  //     }
  //   } catch (error) {
  //     res.send({ message: "Middleware not working" });
  //     req.errorStatus = 401;
  //     console.log(error, "error");
  //     next(error);
  //   }
  // }


  static grantAccess = function(action, resource) {
    return async (req, res, next) => {
     try {
      const permission = roles.can(req.user.role)[action](resource);
      if (!permission.granted) {
       return res.status(401).json({
        error: "You don't have enough permission to perform this action"
       });
      }
      next()
     } catch (error) {
      next(error)
     }
    }
   }
}
