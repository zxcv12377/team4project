// src/components/common/UserItemWithDropdown.jsx
import { useState } from "react";
import UserDropdown from "./UserDropdown";

export default function UserItemWithDropdown({ user, currentUserId, onSelectDMRoom, rightElement }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });

  const handleContextMenu = (e) => {
    e.preventDefault();
    setDropdownPosition({ x: e.clientX, y: e.clientY });
    setShowDropdown(true);
  };

  return (
    <div onContextMenu={handleContextMenu} className="relative">
      <div className="flex items-center justify-between mt-2 px-2 py-1 bg-zinc-800 rounded">
        <span className="text-white">{user.name}</span>
        {rightElement}
      </div>
      {showDropdown && (
        <UserDropdown
          userId={user.mno || user.id || user.memberId}
          userName={user.name}
          currentUserId={currentUserId}
          position={dropdownPosition}
          onClose={() => setShowDropdown(false)}
          onSelectDMRoom={onSelectDMRoom}
        />
      )}
    </div>
  );
}
