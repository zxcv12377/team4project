import { useState, useRef, useEffect } from "react";
import FriendDropdown from "@/components/common/UserDropdown";

export default function UserList({ users }) {
  const [dropdown, setDropdown] = useState(null);
  const menuRef = useRef();

  useEffect(() => {
    if (!dropdown) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setDropdown(null);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdown]);

  return (
    <div>
      <ul>
        {users.map((user) => (
          <li
            key={user.id}
            onContextMenu={(e) => {
              e.preventDefault();
              setDropdown({
                x: e.clientX,
                y: e.clientY,
                userId: user.id,
                userName: user.name,
              });
            }}
            className="px-2 py-1 rounded hover:bg-zinc-700 cursor-pointer select-none"
          >
            {user.name}
          </li>
        ))}
      </ul>
      {dropdown && (
        <div ref={menuRef}>
          <FriendDropdown
            userId={dropdown.userId}
            userName={dropdown.userName}
            x={dropdown.x}
            y={dropdown.y}
            onClose={() => setDropdown(null)}
          />
        </div>
      )}
    </div>
  );
}
