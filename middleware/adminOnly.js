

    const adminOnly = (req, res,next)=>{
        const role = req.user?.role;
        if(role !== "admin"){
            return res .status(403).json({message:"Access denied"});

        }
        next();

        };
        module.exports = adminOnly;