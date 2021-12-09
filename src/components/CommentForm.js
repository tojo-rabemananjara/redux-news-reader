import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createCommentIsPending, postCommentForArticleId
} from '../features/comments/commentsSlice';

export default function CommentForm({ articleId }) {
  const dispatch = useDispatch();
  const [comment, setComment] = useState('');
  
  // Declare isCreatePending here.

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
