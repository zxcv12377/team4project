// src/components/ui/Navbar.jsx
import React from "react";

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full h-16 bg-[#202225] text-white flex items-center px-4 shadow-md z-30">
      <div className="font-bold text-xl">Discord Clone</div>
      {/* <div className="ml-auto text-sm">User Profile</div> */}
    </nav>
  );
}

export default Navbar;
