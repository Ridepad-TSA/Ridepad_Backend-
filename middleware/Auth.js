const jwt = require("jsonwebtoken");

const protect = (req,res,next) =>{

    try{
        /*get the authorization header */
        const authHeader = req.headers.authorization;
        if(!authHeader){
            return res.status(401).json({message:"authorization header needed"})
        }
        /* ensures it starts with "Bearer" */

    if(!authHeader.startsWith("Bearer ")){
        return res.status(401).json({message:"bearer needed"});
    }
    /*extract the jwt */
    const token = authHeader.split(" ")[1];
    if(!token){
          return res.status(401).json({message:"token required"})
  }
   const secret = process.env.JWT_SECRET;
   if(!secret){
     return res.status(500).json({message:"JWT not configured"});
   }
        
   const decoded =jwt.verify (token,secret
   )

   req.user = decoded;

   next();

    }catch(error){
        return res.status(401).json({message:"Invalid or expired token"});
    }
};

module.exports = protect;