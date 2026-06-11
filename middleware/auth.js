module.exports = (req, res, next) => {
  if (!req.session.usuarioId) {
    return res.redirect('/auth/login');
  }
  next();
};