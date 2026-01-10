import React from 'react';

export default function Nepal({ className }: { className?: string }) {
  return (
    <svg
      xmlnsXlink="http://www.w3.org/1999/xlink"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="-17.582 -4.664 71.571 87.246"
      className={className}
    >
      <use xlinkHref="#a" stroke="#003893" strokeWidth="5.165" />
      <path id="a" d="M-15 37.574h60L-15 0v80h60l-60-60z" fill="#DC143C" />
      <g fill="#fff">
        <path d="M-11.95 23.483a12.84 12.84 0 0 0 23.9 0 11.95 11.95 0 0 1-23.9 0" />
        <g transform="translate(0 29.045) scale(5.56106)">
          <circle r="1" />
          <g id="d">
            <g id="c">
              <path
                id="b"
                d="M.195-.98 0-1.39l-.195.408"
                transform="rotate(11.25)"
              />
              <use xlinkHref="#b" transform="rotate(22.5)" />
              <use xlinkHref="#b" transform="rotate(45)" />
            </g>
            <use xlinkHref="#c" transform="rotate(67.5)" />
          </g>
          <use xlinkHref="#d" transform="scale(-1 1)" />
        </g>
        <g transform="translate(0 58.787) scale(8.1434)">
          <circle r="1" />
          <g id="g">
            <g id="f">
              <path id="e" d="M.259.966 0 1.576l-.259-.61" />
              <use xlinkHref="#e" transform="rotate(180)" />
            </g>
            <use xlinkHref="#f" transform="rotate(90)" />
          </g>
          <use xlinkHref="#g" transform="rotate(30)" />
          <use xlinkHref="#g" transform="rotate(60)" />
        </g>
      </g>
    </svg>
  );
}
