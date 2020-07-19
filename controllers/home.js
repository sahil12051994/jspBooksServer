/**
 * GET /
 * Home page.
 */
exports.index = (req, res) => {
  res.render('index.html', {
    title: 'Home'
  });
};

exports.login = (req, res) => {
  res.render('login.html', {
    title: 'Home'
  });
};

exports.upload = (req, res) => {
  res.render('uploadBook.html', {
    title: 'Home'
  });
};

exports.bookPage = (req, res) => {
  res.render('books.html', {
    title: 'Home'
  });
};
