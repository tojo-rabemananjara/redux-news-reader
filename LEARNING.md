# 21. Redux

## redux-news-reader Async Thunks etc.

## Project Structure

<img src="../../../../../../../../../Library/Application%20Support/typora-user-images/image-20211217075907169.png" alt="image-20211217075907169" style="zoom:50%;" />

## Async Actions with Middleware and Thunks

```react
//index.js
import React from 'react';
import ReactDOM from 'react-dom';
import App from './app/App';
import store from './app/store';
import { Provider } from 'react-redux';

const { worker } = require('./mocks/browser');
worker.start();

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);
```

## app

```react
//App.js
import React from 'react';
import ArticlePreviews from '../features/articlePreviews/ArticlePreviews';
import CurrentArticle from '../features/currentArticle/CurrentArticle';
import Comments from '../features/comments/Comments';

function App() {
  return (
    <div className='App'>
      <header className='App-header' />
      <main>
        <div className='current-article'>
          <CurrentArticle />
          <Comments />
        </div>
        <ArticlePreviews />
      </main>
    </div>
  );
}

export default App;
```

```react
//store.js
import { configureStore } from '@reduxjs/toolkit';
import articlePreviewsReducer from '../features/articlePreviews/articlePreviewsSlice';
import currentArticleReducer from '../features/currentArticle/currentArticleSlice';
import commentsReducer from '../features/comments/commentsSlice';

export default configureStore({
  reducer: {
    articlePreviews: articlePreviewsReducer,
    currentArticle: currentArticleReducer,
    comments: commentsReducer
  },
});
```

*   Where `configureStore` is used
    *   integrates app's reducers!

## components

```react
//Comment.js
import React from 'react';

export default function Comment({ comment }) {
  const { id, text } = comment
  return (
    <li key={id} className='comment-container'>
      <span>{text}</span>
    </li>
  );
}
```

```react
//CommentList.js
import React from 'react';
import Comment from './Comment';

export default function CommentList({ comments }) {
  if (!comments) {
    return null;
  }
  
  return (
    <ul className='comments-list'>
      {
        comments.map(comment => {
          return <Comment comment={comment} />
        })
      }
    </ul>
  );
}
```

```react
//CommentForm.js
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createCommentIsPending, postCommentForArticleId
} from '../features/comments/commentsSlice';

export default function CommentForm({ articleId }) {
  const dispatch = useDispatch();
  const [comment, setComment] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // dispatch your asynchronous action here!
    dispatch(postCommentForArticleId(
      {
        articleId: articleId,
        comment: comment
      }))
    setComment('');
  };

  // Declare isCreatePending here.
  const isCreatePending = useSelector(createCommentIsPending);
  const isEmptyComment = (comment === '');

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor='comment' className='label'>
        Add Comment:
      </label>
      <div id='input-container'>
        <input
          id='comment'
          value={comment}
          onChange={(e) => setComment(e.currentTarget.value)}
          type='text'
        />
        <button
          disabled={isCreatePending || isEmptyComment}
          className='comment-button'
        >
          Submit
        </button>
      </div>
    </form>
  );
}
```

*   Need `configureStore` to use `dispatch`
*   `useSelector` function to select a variable that describes some part of the state of the app

```react
//ArticleListItem.js
import React from 'react';

export default function ArticleListItem({ article }) {
  return (
    <button key={article.id} className='article-container'>
      <img src={article.image} alt='' className='article-image' />
      <div className='article-content-container'>
        <h3 className='article-title'>{article.title}</h3>
        <p className='article-preview'>{article.preview}</p>
      </div>
    </button>
  );
}
```

```react
//FullArticle.js
import React from 'react';

export default function FullArticle({ article }) {
  return (
    <>
      <div className='article-full-image-container'>
        <img src={article.image} alt='' />
      </div>
      <div key={article.id} className='current-article-container'>
        <h1 className='current-article-title'>{article.title}</h1>
        <div className='article-full-text'>{article.fullText}</div>
      </div>
    </>
  );
}
```

## features

### articlePreviews

```react
//ArticlePreviews.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  loadAllPreviews,
  selectAllPreviews,
  isLoading,
} from './articlePreviewsSlice';
import { loadCurrentArticle } from '../currentArticle/currentArticleSlice';
import ArticleListItem from '../../components/ArticleListItem';

const ArticlePreviews = () => {
  const dispatch = useDispatch();
  const articlePreviews = useSelector(selectAllPreviews);
  const isLoadingPreviews = useSelector(isLoading);

  useEffect(() => {
    dispatch(loadAllPreviews());
  }, [dispatch]);

  if (isLoadingPreviews) {
    return <div>loading state</div>;
  }

  return (
    <>
      <section className='articles-container'>
        <h2 className='section-title'>All Articles</h2>
        {articlePreviews.map((article) => (
          <div key={article.id} onClick={(e) => dispatch(loadCurrentArticle(article.id))}>
            <ArticleListItem article={article} />
          </div>
        ))}
      </section>
    </>
  );
};

export default ArticlePreviews;
```

*   `dispatch` comes from a custom `hook` so it doesn't have an stable signature therefore will change on each render (reference equality).
    *   Hence it's listed as a dependency in `useEffect`

```react
//articlePreviewsSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

export const loadAllPreviews = createAsyncThunk(
  'articlePreviews/loadAllPreviews',
  async () => {
    const data = await fetch('api/articles');
    const json = await data.json();
    console.log(json);
    return json;
  }
);

export const articlePreviewsSlice = createSlice({
  name: 'articlePreviews',
  initialState: {
    articles: [],
    isLoadingArticlePreviews: false,
    hasError: false
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadAllPreviews.pending, (state) => {
        state.isLoadingArticlePreviews = true;
        state.hasError = false;
      })
      .addCase(loadAllPreviews.fulfilled, (state, action) => {
        state.isLoadingArticlePreviews = false;
        state.articles = action.payload;
      })
      .addCase(loadAllPreviews.rejected, (state, action) => {
        state.isLoadingArticlePreviews = false;
        state.hasError = true;
        state.articles = [];
      })
  },
});

export const selectAllPreviews = (state) => state.articlePreviews.articles;

export const isLoading = (state) => state.articlePreviews.isLoading;

export default articlePreviewsSlice.reducer;
```

*   has `isLoading`, `hasError` vars for asynchronous stuff
*   `useSelector(isLoading)` would get `state.articlePreviews.isLoading` without dealing with unnecessary visibility of state to non-Slice .js files

### comments

```react
//Comments.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  loadCommentsForArticleId,
  selectComments,
  isLoadingComments,
} from '../comments/commentsSlice';
import { selectCurrentArticle } from '../currentArticle/currentArticleSlice';
import CommentList from '../../components/CommentList';
import CommentForm from '../../components/CommentForm';

const Comments = () => {
  const dispatch = useDispatch();
  const article = useSelector(selectCurrentArticle);
  // Declare additional selected data here.
  const comments = useSelector(selectComments);
  const commentsAreLoading = useSelector(isLoadingComments);

  // Dispatch loadCommentsForArticleId with useEffect here.
  useEffect( () => {
    if (article)
      dispatch(loadCommentsForArticleId(article.id));
  }, [dispatch, article]);

  const commentsForArticleId = article ? comments[article.id] : [];

  if (commentsAreLoading) return <div>Loading Comments</div>;
  if (!article) return null;

  return (
    <div className='comments-container'>
      <h3 className='comments-title'>Comments</h3>
      <CommentList comments={commentsForArticleId} />
      <CommentForm articleId={article.id} />
    </div>
  );
};

export default Comments;
```

```react
//commentsSlice.js
// Import createAsyncThunk and createSlice here.
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

// Create loadCommentsForArticleId here.
export const loadCommentsForArticleId = createAsyncThunk(
  'comments/loadCommentsForArticleId',
  async (id) => {
    const response = await fetch(`api/articles/${id}/comments`);
    const json = await response.json();
    return json;
  });

// Create postCommentForArticleId here.
export const postCommentForArticleId = createAsyncThunk(
  'comments/postCommentForArticleId',
  async ({articleId, comment}) => {
    const requestBody = JSON.stringify({comment: comment});
    const response = await fetch(`api/articles/${articleId}/comments`, {
      method: 'POST',
      body: requestBody
    });
    const json = await response.json();
    return json;
  }
)

export const commentsSlice = createSlice({
  name: 'comments',
  initialState: {
    // Add initial state properties here.
    byArticleId: {},
    isLoadingComments: false,
    failedToLoadComments: false,
    createCommentIsPending: false,
    failedToCreateComment: false
  },
  // Add extraReducers here.
  extraReducers: {
    [loadCommentsForArticleId.pending]: (state, action) => {
      state.isLoadingComments = true;
      state.failedToLoadComments = false;
    },
    [loadCommentsForArticleId.rejected]: (state, action) => {
      state.isLoadingComments = false;
      state.failedToLoadComments = true;
      state.comments = {};
    },
    [loadCommentsForArticleId.fulfilled]: (state, action) => {
      state.isLoadingComments = false;
      state.failedToLoadComments = false;
      state.byArticleId[action.payload.articleId] = action.payload.comments;
    },
    [postCommentForArticleId.pending]: (state, action) => {
      state.createCommentIsPending = true;
      state.failedToCreateComment = false;
    },
    [postCommentForArticleId.rejected]: (state, action) => {
      state.createCommentIsPending = false;
      state.failedToCreateComment = true;
    },
    [postCommentForArticleId.fulfilled]: (state, action) => {
      state.createCommentIsPending = false;
      state.failedToCreateComment = false;
      state.byArticleId[action.payload.articleId].push(action.payload);
    }
  }
});

export const selectComments = (state) => state.comments.byArticleId;
export const isLoadingComments = (state) => state.comments.isLoadingComments;
export const createCommentIsPending = (state) => state.comments.createCommentIsPending;

export default commentsSlice.reducer;
```

*   You will use reducers most of the time. You would use **extraReducers when you are dealing with an action that you have already defined somewhere else**. The most common examples are responding to a createAsyncThunk action and responding to an action from another slice
*   createAsyncThunk: All you have to write is an asynchronous thunk function; `createAsyncThunk` takes care of the rest, ***==returning an action creator that will dispatch <u>pending</u>/<u>fulfilled</u>/<u>rejected</u> actions as appropriate.==***

### currentArticle

```react
//CurrentArticle.js
import { useSelector } from 'react-redux';
import {
  selectCurrentArticle,
  isLoadingCurrentArticle,
} from '../currentArticle/currentArticleSlice';
import FullArticle from '../../components/FullArticle';

const CurrentArticle = () => {
  // const dispatch = useDispatch();
  const article = useSelector(selectCurrentArticle);
  const currentArticleIsLoading = useSelector(isLoadingCurrentArticle);

  if (currentArticleIsLoading) {
    return <div>Loading</div>;
  } else if (!article) {
    return null;
  }

  return <FullArticle article={article} />;
};

export default CurrentArticle;
```

```react
//currentArticleSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

export const loadCurrentArticle = createAsyncThunk(
  'currentArticle/loadCurrentArticle',
  async (articleId) => {
    const data = await fetch(`api/articles/${articleId}`);
    const json = await data.json();
    return json;
  }
);

export const currentArticleSlice = createSlice({
  name: 'currentArticle',
  initialState: {
    article: undefined,
    isLoadingCurrentArticle: false,
    hasError: false
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadCurrentArticle.pending, (state) => {
        state.isLoadingCurrentArticle = true;
        state.hasError = false;
      })
      .addCase(loadCurrentArticle.fulfilled, (state, action) => {
        state.isLoadingCurrentArticle = false;
        state.hasError = false;
        state.article = action.payload;
      })
      .addCase(loadCurrentArticle.rejected, (state) => {
        state.isLoadingCurrentArticle = false;
        state.hasError = true;
        state.article = {};
      })
  },
});

export const selectCurrentArticle = (state) => state.currentArticle.article;
export const isLoadingCurrentArticle = (state) => state.currentArticle.isLoadingCurrentArticle;

export default currentArticleSlice.reducer;
```

*   Another way to setup lifecycle method actions that change  `isLoadingCurrentArticle`, `hasError`, `article`, etc.

## mocks

```json
//articles.json
[
    {
      "id": 1,
      "title": "Biden Inaugurated as 46th President - The New York Times",
      "preview": "Joseph Robinette Biden Jr. and Kamala Devi Harris took the oath of office at a Capitol still reeling from the attack of a violent mob at a time when a deadly pandemic is still ravaging the country.",
      "fullText": "Joseph Robinette Biden Jr. and Kamala Devi Harris took the oath of office at a Capitol still reeling from the attack of a violent mob at a time when a deadly pandemic is still ravaging the country.",
      "image": "https://static01.nyt.com/images/2021/01/20/us/politics/20dc-biden1-sub3/20dc-biden1-sub3-facebookJumbo.jpg"
    },
    {
      "id": 2,
      "title": "LG says it might quit the smartphone market",
      "preview": "LG says it needs to make \"a cold judgment\" about its only money-losing division.",
      "fullText": "LG says it needs to make \"a cold judgment\" about its only money-losing division.",
      "image": "https://cdn.arstechnica.net/wp-content/uploads/2021/01/37-760x380.jpg"
    },
    {
      "id": 3,
      "title": "VW CEO teases Tesla’s Elon Musk in Twitter debut",
      "preview": "VW CEO Herbert Diess is poking fun at his friendly rivalry with Tesla CEO Elon Musk in his Twitter debut as he tries to position Volkswagen as a leader in electrification.",
      "fullText": "TVW CEO Herbert Diess is poking fun at his friendly rivalry with Tesla CEO Elon Musk in his Twitter debut as he tries to position Volkswagen as a leader in electrification.",
      "image": "https://i1.wp.com/electrek.co/wp-content/uploads/sites/3/2020/09/VW-CEO-Hebert-Diess-Tesla-CEO-Elon-Musk-selfie-hero.jpg?resize=1200%2C628&quality=82&strip=all&ssl=1"
    },
    {
      "id": 4,
      "title": "QAnon believers struggle with inauguration.",
      "preview": "As President Biden took office, some QAnon believers tried to rejigger their theories to accommodate a transfer of power.",
      "fullText": "As President Biden took office, some QAnon believers tried to rejigger their theories to accommodate a transfer of power.",
      "image": "https://static01.nyt.com/images/2021/01/20/business/20distortions-qanon/20distortions-qanon-facebookJumbo.jpg"
    },
    {
      "id": 5,
      "title": "Kamala Harris sworn into history",
      "preview": "Harris becomes the first woman, Black woman and Asian American to serve as vice president.",
      "fullText": "Harris becomes the first woman, Black woman and Asian American to serve as vice president.",
      "image": "https://www.washingtonpost.com/wp-apps/imrs.php?src=https://arc-anglerfish-washpost-prod-washpost.s3.amazonaws.com/public/H4TGAGS3IEI6XKCJN6KCHJ277U.jpg&w=1440"
    },
    {
      "id": 6,
      "title": "SpaceX expands public beta test of Starlink satellite internet to Canada and the UK",
      "preview": "Elon Musk's company is now offering early public access to its Starlink satellite internet service in Canada and the U.K.",
      "fullText": "Elon Musk's company is now offering early public access to its Starlink satellite internet service in Canada and the U.K.",
      "image": "https://image.cnbcfm.com/api/v1/image/106758975-1603465968180-EkzQ0UbXgAAGYVe-orig.jpg?v=1603466027"
    },
    {
      "id": 7,
      "title": "Scientists have finally worked out how butterflies fly",
      "preview": "Experts, long puzzled by how butterflies fly, have found that the insects \"clap\" their wings together -- and their wings are perfectly evolved for better propulsion.",
      "fullText": "Experts, long puzzled by how butterflies fly, have found that the insects \"clap\" their wings together -- and their wings are perfectly evolved for better propulsion.",
      "image": "https://cdn.cnn.com/cnnnext/dam/assets/210120064324-restricted-butterflies-clap-intl-scli-super-tease.jpg"
    },
    {
      "id": 8,
      "title": "Navalny releases investigation into decadent billion-dollar 'Putin palace'",
      "preview": "Even locked up in a detention center on the outskirts of Moscow, Kremlin critic Alexey Navalny continues to be a thorn in Russian President Vladimir Putin's side.",
      "fullText": "Even locked up in a detention center on the outskirts of Moscow, Kremlin critic Alexey Navalny continues to be a thorn in Russian President Vladimir Putin's side.",
      "image": "https://cdn.cnn.com/cnnnext/dam/assets/210120111237-restricted-05-putin-palace-navalny-russia-intl-super-tease.jpeg"
    }
  ]
```

```json
[
    {
      "id": 1,
      "articleId": 5,
      "text": "Congratulations Kamala."
    },
    {
      "id": 2,
      "articleId": 5,
      "text": "Wow, very cool."
    },
    {
      "id": 2,
      "articleId": 7,
      "text": "Butterflies are so awesome!!!"
    },
      {
      "id": 2,
      "articleId": 2,
      "text": "Sad, I love my LG phone :("
    }
  ]
```

```react
//browser.js
import { setupWorker } from 'msw';

import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
```

*   Some stuff I don't get really yet

```react
//handlers.js
import { rest } from 'msw';
import articlesData from './articles.json';
import commentsData from './comments.json';

const userComments = {};

function mockDelay(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

export const handlers = [
  rest.get('/api/articles', (req, res, ctx) => {
    mockDelay(1000);
    return res(
      ctx.status(200),
      ctx.json(
        articlesData.map((article) => ({
          id: article.id,
          title: article.title,
          preview: article.preview,
          image: article.image,
        }))
      )
    );
  }),
  rest.get('/api/articles/:articleId', (req, res, ctx) => {
    mockDelay(1000);
    const { articleId } = req.params;
    return res(
      ctx.status(200),
      ctx.json(
        articlesData.find((article) => article.id === parseInt(articleId))
      )
    );
  }),
  rest.get('/api/articles/:articleId/comments', (req, res, ctx) => {
    mockDelay(1000);
    const { articleId } = req.params;
    const userCommentsForArticle = userComments[articleId] || [];
    return res(
      ctx.status(200),
      ctx.json({
        articleId: parseInt(articleId),
        comments: commentsData
          .filter((comment) => comment.articleId === parseInt(articleId))
          .concat(userCommentsForArticle),
      })
    );
  }),
  rest.post('/api/articles/:articleId/comments', (req, res, ctx) => {
    mockDelay(1000);
    const { articleId } = req.params;
    const commentResponse = {
      id: commentsData.length,
      articleId: parseInt(articleId),
      text: JSON.parse(req.body).comment,
    };

    if (userComments[articleId]) {
      userComments[articleId].push(commentResponse);
    } else {
      userComments[articleId] = [commentResponse];
    }

    return res(ctx.status(200), ctx.json(commentResponse));
  }),
];
```

*   Lots of stuff I don't really get yet.
*   Seems like Backend stuff
