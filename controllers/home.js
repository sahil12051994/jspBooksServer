/**
 * GET /
 * Home page.
 */
exports.index = (req, res) => {
  if (!req.user) {
    return res.send({
      "redirect": "jsp/login"
    });
  } else {
    res.render('index.html', {
      title: 'Home'
    });
  }
};

exports.login = (req, res) => {
  res.render('login.html', {
    title: 'Home'
  });
};

exports.upload = (req, res) => {
  if (!req.user) {
    return res.send({
      "redirect": "jsp/login"
    });
  } else {
    res.render('uploadBook.html', {
      title: 'Home'
    });
  }
};

exports.bookPage = (req, res) => {
  if (!req.user) {
    return res.send({
      "redirect": "jsp/login"
    });
  } else {
    res.render('books.html', {
      title: 'Home'
    });
  }
};

exports.adminPage = (req, res) => {
  if (!req.user) {
    return res.send({
      "redirect": "jsp/login"
    });
  } else {
    res.render('admin.html', {
      title: 'Home'
    });
  }
};
