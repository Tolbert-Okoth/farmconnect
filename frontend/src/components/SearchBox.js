import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SearchBox = () => {
  const [keyword, setKeyword] = useState('');
  const navigate = useNavigate();

  const submitHandler = (e) => {
    e.preventDefault();
    const q = keyword.trim();
    if (q) {
      navigate(`/search/${encodeURIComponent(q)}`);
      setKeyword('');
    } else {
      navigate('/');
    }
  };

  return (
    <form onSubmit={submitHandler} className="soko-search" role="search">
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#7a6352" strokeWidth="2.2" strokeLinecap="round">
        <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
      </svg>
      <input
        type="search"
        name="q"
        aria-label="Search produce"
        onChange={(e) => setKeyword(e.target.value)}
        value={keyword}
        placeholder="Search sukuma, avocado, maize…"
      />
      <button type="submit">Search</button>
    </form>
  );
};

export default SearchBox;
