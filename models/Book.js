const mongoose = require('mongoose');
const User = require('../models/User');

const BookSchema = new mongoose.Schema({
  bookName: {
    type: String,
    required: true
  },
  bookId: {
    type: String,
    required: true,
    unique: true
  },
  instituteUsing: [{
    instituteType: {
      type: String,
    },
    instituteName: {
      type: String,
    }
  }],
  bookAuthor: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: String,
  },
  bookTags: [{
    type: String,
  }],
  bookPrice: {
    type: Number,
  },
  bookType: {
    type: String,
  },
  bookDescription: {
    type: String,
  },
  bookPages: [{
    pageNumber: {
      type: Number,
    },
    pageImagePath: {
      type: String,
    },
    pageText: {
      type: String,
    },
    pageTags: [{
      type: String,
    }]
  }]
}, {
  collection: 'book'
});

const Book = mongoose.model('book', BookSchema);

// FrameSchema.index({ time: 1, camId: 1 })
// FrameSchema.index({ time: 1})

module.exports = Book;

let tempBooks = [{
    "bookName": "Netbook",
    "bookId": "2091fdad-5c73-4f6e-92c6-513f74935dce",
    "bookPrice": 30,
    "bookAuthor": "Miles Castro",
    "company": "MIRACULA",
    "bookDescription": "Aute occaecat ipsum cillum est reprehenderit id aliquip nostrud consequat nisi enim incididunt. Commodo sit excepteur proident amet do duis nisi anim minim nisi sint minim ad. Cupidatat duis pariatur aliqua excepteur nostrud Lorem ea ipsum minim commodo. Commodo officia nulla sint dolore anim adipisicing deserunt. Ut id fugiat cillum pariatur in magna et commodo adipisicing velit officia id pariatur commodo. Commodo est consequat laborum veniam ipsum ea duis occaecat aliqua elit culpa.",
    "bookPages": [{
        "pageNumber": 0,
        "pageImagePath": "http://placehold.it/32x32"
      },
      {
        "pageNumber": 1,
        "pageImagePath": "http://placehold.it/32x32"
      },
      {
        "pageNumber": 2,
        "pageImagePath": "http://placehold.it/32x32"
      },
      {
        "pageNumber": 3,
        "pageImagePath": "http://placehold.it/32x32"
      },
      {
        "pageNumber": 4,
        "pageImagePath": "http://placehold.it/32x32"
      }
    ]
  },
  {
    "bookName": "Skyplex",
    "bookId": "536a8a78-c80d-4cef-905a-1b42560a0362",
    "bookPrice": 25,
    "bookAuthor": "Florence Finley",
    "company": "FROLIX",
    "bookDescription": "Ullamco irure amet dolore sit velit labore nulla velit cupidatat enim. Exercitation sit consequat pariatur ipsum ullamco. Labore incididunt eiusmod velit Lorem mollit commodo irure adipisicing veniam pariatur ut ut est commodo. Dolore deserunt cupidatat commodo nostrud qui elit reprehenderit sit eu mollit incididunt qui dolor.",
    "bookPages": [{
        "pageNumber": 0,
        "pageImagePath": "http://placehold.it/32x32"
      },
      {
        "pageNumber": 1,
        "pageImagePath": "http://placehold.it/32x32"
      },
      {
        "pageNumber": 2,
        "pageImagePath": "http://placehold.it/32x32"
      },
      {
        "pageNumber": 3,
        "pageImagePath": "http://placehold.it/32x32"
      },
      {
        "pageNumber": 4,
        "pageImagePath": "http://placehold.it/32x32"
      }
    ]
  },
  {
    "bookName": "Netility",
    "bookId": "631424a5-bfc3-4567-9aa5-2d4feb2b1fce",
    "bookPrice": 33,
    "bookAuthor": "Candy Combs",
    "company": "BUZZMAKER",
    "bookDescription": "Excepteur ad amet aute exercitation. Est proident dolor velit ad qui reprehenderit commodo. Est deserunt sit et laborum ad tempor anim. Ad occaecat eu tempor labore dolor aliquip aliquip reprehenderit magna labore irure dolore ut sunt. Dolore ea incididunt consequat ad consectetur laboris labore enim et eu Lorem culpa.",
    "bookPages": [{
        "pageNumber": 0,
        "pageImagePath": "http://placehold.it/32x32"
      },
      {
        "pageNumber": 1,
        "pageImagePath": "http://placehold.it/32x32"
      },
      {
        "pageNumber": 2,
        "pageImagePath": "http://placehold.it/32x32"
      },
      {
        "pageNumber": 3,
        "pageImagePath": "http://placehold.it/32x32"
      },
      {
        "pageNumber": 4,
        "pageImagePath": "http://placehold.it/32x32"
      }
    ]
  },
  {
    "bookName": "Petigems",
    "bookId": "2ec54948-60dc-49a3-9867-e849fae71933",
    "bookPrice": 20,
    "bookAuthor": "Ashley Campbell",
    "company": "ADORNICA",
    "bookDescription": "Excepteur ipsum aliquip dolore voluptate tempor non id dolore incididunt amet consequat. Tempor duis dolor do enim adipisicing. Aliquip est cillum quis adipisicing occaecat.",
    "bookPages": [{
        "pageNumber": 0,
        "pageImagePath": "http://placehold.it/32x32"
      },
      {
        "pageNumber": 1,
        "pageImagePath": "http://placehold.it/32x32"
      },
      {
        "pageNumber": 2,
        "pageImagePath": "http://placehold.it/32x32"
      },
      {
        "pageNumber": 3,
        "pageImagePath": "http://placehold.it/32x32"
      },
      {
        "pageNumber": 4,
        "pageImagePath": "http://placehold.it/32x32"
      }
    ]
  },
  {
    "bookName": "Vitricomp",
    "bookId": "19643e4e-abd7-4455-9dad-1c0b1170e67a",
    "bookPrice": 38,
    "bookAuthor": "Maribel Slater",
    "company": "PHARMEX",
    "bookDescription": "Cupidatat fugiat et nulla aliqua do in occaecat anim reprehenderit. Aliqua aute est occaecat Lorem proident eiusmod magna consequat do nisi laborum. Enim excepteur culpa cupidatat in excepteur dolor consectetur mollit labore sit non exercitation esse consequat. Veniam deserunt sit sint sint et incididunt minim id occaecat sint dolor qui occaecat. Quis consectetur tempor eu elit consequat deserunt veniam et consectetur. Est qui in proident deserunt enim magna veniam ex.",
    "bookPages": [{
        "pageNumber": 0,
        "pageImagePath": "http://placehold.it/32x32"
      },
      {
        "pageNumber": 1,
        "pageImagePath": "http://placehold.it/32x32"
      },
      {
        "pageNumber": 2,
        "pageImagePath": "http://placehold.it/32x32"
      },
      {
        "pageNumber": 3,
        "pageImagePath": "http://placehold.it/32x32"
      },
      {
        "pageNumber": 4,
        "pageImagePath": "http://placehold.it/32x32"
      }
    ]
  }
]
