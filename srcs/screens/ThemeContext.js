// import React, { createContext, useState, useContext } from "react";

// const ThemeContext = createContext();

// export const ThemeProvider = ({ children }) => {
//   const [theme, setTheme] = useState("light");

//   const toggleTheme = () => {
//     setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
//   };

//   return (
//     <ThemeContext.Provider value={{ theme, toggleTheme }}>
//       {children}
//     </ThemeContext.Provider>
//   );
// };

// export const useTheme = () => useContext(ThemeContext);

// export const themeStyles = {
//   light: {
//     backgroundColor: "#ffffff",
//     color: "#000000",
//   },
//   dark: {
//     backgroundColor: "#000000",
//     color: "#ffffff",
//   },
// };
import React, { createContext, useState, useContext } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("light");

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export const themeStyles = {
  light: {
    backgroundColor: "#ffffff",
    color: "#000000",
  },
  dark: {
    backgroundColor: "#000000",
    color: "#ffffff",
  },
};