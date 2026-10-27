import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './UserFeedbacks.css';

const getVisibleReplies = (replies = []) => replies.reduce((visibleReplies, reply) => {
  if (!['pending', 'failed'].includes(reply.status)) {
    visibleReplies.push(reply);
    return visibleReplies;
  }

  const normalizedMessage = String(reply.message || '').trim().replace(/\s+/g, ' ').toLowerCase();
  const duplicateIndex = visibleReplies.findIndex((visibleReply) => (
    ['pending', 'failed'].includes(visibleReply.status)
    && String(visibleReply.repliedBy || '') === String(reply.repliedBy || '')
    && String(visibleReply.message || '').trim().replace(/\s+/g, ' ').toLowerCase() === normalizedMessage
  ));
  if (duplicateIndex !== -1) visibleReplies.splice(duplicateIndex, 1);
  visibleReplies.push(reply);
  return visibleReplies;
}, []);

const UserFeedbacks = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [error, setError] = useState('');
  const [replyingTo, setReplyingTo] = useState('');
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replyNotice, setReplyNotice] = useState(null);

  useEffect(() => {
    axios.get('/api/services/feedbacks', {
      headers: { Authorization: `Bearer ${sessionStorage.getItem('token') || localStorage.getItem('token')}` }
    })
      .then((response) => setFeedbacks(response.data.feedbacks || []))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load user feedbacks.'));
  }, []);

  const submitReply = async (event, feedback) => {
    event.preventDefault();
    setSendingReply(true);
    setReplyNotice(null);
    try {
      const response = await axios.post(`/api/services/feedbacks/${feedback._id}/reply`, { reply: replyText }, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('token') || localStorage.getItem('token')}` },
      });
      const savedReply = response.data.reply;
      if (savedReply) {
        setFeedbacks((currentFeedbacks) => currentFeedbacks.map((item) => (
          item._id !== feedback._id ? item : (() => {
            const replies = [...(item.replies || [])];
            const existingReplyIndex = replies.findIndex((itemReply) => itemReply._id === savedReply._id);
            if (existingReplyIndex === -1) replies.push(savedReply);
            else replies[existingReplyIndex] = savedReply;
            return {
              ...item,
              status: replies.some((itemReply) => itemReply.status === 'sent') ? 'replied' : 'pending',
              replies,
            };
          })()
        )));
      }
      setReplyNotice({
        feedbackId: feedback._id,
        type: response.data.emailAccepted === true ? 'success' : 'warning',
        message: response.data.message || (response.data.emailAccepted === true
          ? 'The email provider accepted the reply. Inbox delivery is not confirmed.'
          : 'The reply was saved, but the email provider did not accept it.'),
      });
      if (response.data.emailAccepted === true) {
        setReplyText('');
        setReplyingTo('');
      }
    } catch (requestError) {
      const message = requestError.response?.status === 403
        ? 'This session does not have administrator permission. Sign in again with an admin account and retry.'
        : requestError.response?.data?.message || 'Unable to send the reply.';
      setReplyNotice({
        feedbackId: feedback._id,
        type: 'error',
        message,
      });
    } finally {
      setSendingReply(false);
    }
  };

  const renderSavedReply = (savedReply, label = 'Admin reply') => (
    <div key={savedReply._id} className={`user-feedback-saved-reply ${savedReply.status}`}>
      <div className="user-feedback-saved-reply-heading">
        <strong>{label}</strong>
        <span>{savedReply.status === 'sent' ? 'Email accepted' : savedReply.status === 'failed' ? 'Email not accepted' : 'Email pending'}</span>
      </div>
      <p>{savedReply.message}</p>
      <time dateTime={savedReply.createdAt}>{new Date(savedReply.createdAt).toLocaleString()}</time>
    </div>
  );

  return (
    <main className="user-feedbacks-page">
      <header className="user-feedbacks-compact-header">
        <h1>💬 User Feedbacks / የተጠቃሚዎች አስተያየት</h1>
        <Link to="/admin-dashboard" className="user-feedbacks-back">
          <span aria-hidden="true">←</span> Back to Dashboard
        </Link>
      </header>
      <section className="user-feedbacks-panel">
        {error && <p role="alert" className="user-feedback-error">{error}</p>}
        <div className="user-feedbacks-list">
          {feedbacks.length ? feedbacks.map((feedback) => (
            <article key={feedback._id} className="user-feedback-card">
              {(() => {
                const visibleReplies = getVisibleReplies(feedback.replies || []);
                return (
                  <>
              <div className="user-feedback-card-header">
                <strong className="user-feedback-author">{feedback.name || 'Anonymous'}</strong>
                <div className="user-feedback-card-header-meta">
                  <span className={`user-feedback-status ${feedback.replies?.some((savedReply) => savedReply.status === 'sent') ? 'replied' : 'pending'}`}>
                    {feedback.replies?.some((savedReply) => savedReply.status === 'sent') ? 'Replied' : 'Pending'}
                  </span>
                  <time className="user-feedback-date" dateTime={feedback.createdAt || undefined}>
                    {feedback.createdAt ? new Date(feedback.createdAt).toLocaleDateString() : 'No date'}
                  </time>
                </div>
              </div>
              <div className="user-feedback-meta">
                <p><strong>Email:</strong> <span className="user-feedback-email">{feedback.email || feedback.contact || 'No contact'}</span></p>
                {feedback.subject && <p><strong>Subject:</strong> <span className="user-feedback-subject">{feedback.subject}</span></p>}
              </div>
              <p className="user-feedback-message">{feedback.message}</p>
              {visibleReplies.length > 1 && (
                <details className="user-feedback-reply-history">
                  <summary>Previous replies ({visibleReplies.length - 1})</summary>
                  {visibleReplies.slice(0, -1).map((savedReply) => renderSavedReply(savedReply, 'Previous admin reply'))}
                </details>
              )}
              {visibleReplies.length > 0 && renderSavedReply(visibleReplies[visibleReplies.length - 1], 'Latest admin reply')}
              {replyNotice?.feedbackId === feedback._id && (
                <p role="status" className={`user-feedback-reply-notice ${replyNotice.type}`}>
                  {replyNotice.message}
                </p>
              )}
              <div className="user-feedback-reply-area">
                {replyingTo === feedback._id ? (
                  <form onSubmit={(event) => submitReply(event, feedback)} className="user-feedback-reply-form">
                    <label htmlFor={`feedback-reply-${feedback._id}`}>Reply by email</label>
                    <textarea
                      id={`feedback-reply-${feedback._id}`}
                      value={replyText}
                      onChange={(event) => setReplyText(event.target.value)}
                      maxLength={5000}
                      rows={4}
                      required
                      disabled={sendingReply}
                      placeholder="Write your response to the user..."
                    />
                    <div className="user-feedback-reply-actions">
                      <button type="button" disabled={sendingReply} onClick={() => { setReplyingTo(''); setReplyText(''); setReplyNotice(null); }} className="user-feedback-cancel">
                        Cancel
                      </button>
                      <button type="submit" disabled={sendingReply || !replyText.trim()} className="user-feedback-send">
                        {sendingReply ? 'Sending...' : feedback.replies?.[feedback.replies.length - 1]?.status === 'failed' ? 'Retry Email' : 'Send Reply'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    disabled={!feedback.email}
                    onClick={() => {
                      const lastReply = feedback.replies?.[feedback.replies.length - 1];
                      setReplyingTo(feedback._id);
                      setReplyText(lastReply?.status === 'failed' ? lastReply.message : '');
                      setReplyNotice(null);
                    }}
                    title={!feedback.email ? 'This feedback has no reply email address.' : 'Reply to this feedback by email'}
                    className="user-feedback-reply-button"
                  >
                    Reply by Email
                  </button>
                )}
                {!feedback.email && <p className="user-feedback-no-email">No email address was provided, so an email reply is unavailable.</p>}
              </div>
                  </>
                );
              })()}
            </article>
          )) : !error && <p className="user-feedback-empty">No user feedbacks available.</p>}
        </div>
      </section>
      <footer className="user-feedbacks-compact-footer">
        <p>© {new Date().getFullYear()} ኢ-ቀበሌ ፖርታል. መብቱ በህግ የተጠበቀ ነው።</p>
        <nav aria-label="Footer navigation">
          <Link to="/about">ስለ እኛ</Link>
          <Link to="/contact">ያግኙን</Link>
        </nav>
      </footer>
    </main>
  );
};

export default UserFeedbacks;
