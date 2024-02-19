const jwt = require('jsonwebtoken');

// const authMiddleware = (req, res, next) => {
//   const token = req.cookies.token;
//   if (!token) {
//     return res.redirect('/login').status(401).json({ error: 'Unauthorized: No token provided' });
//   }
//   jwt.verify(token, 'jwtSecret', (error
//   , decoded) => {
//     if (error) {
//       return res.status(401).json({ error: 'Unauthorized: Failed to authenticate' });
//     }
//     req.userId = decoded.id;
//     next();
//   }
//   );
// };
const authMiddleware = (req, res, next) => {
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token, 'jwtSecret', (error, decoded) => {
      if (error) {
        console.log(error);
        res.redirect('/login');
      } else {
        console.log(decoded);
        next();
      }
  });} else {
    res.redirect('/login');
  }
}

module.exports = authMiddleware;
