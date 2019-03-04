module.exports = function(error){
    return {
        200:"OK",
        403:"Access Denied",
        404:"Not Found",
        500:"Internal Server Error"
    }[error];
};