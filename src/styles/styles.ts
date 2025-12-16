const styles = {
  container: {
    backgroundColor: "#000",
    color: "#fff",
    padding: "12px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontSize: "12px",
    borderTop: "1px solid #333",
    borderLeft: "1px solid #333",
    borderRight: "1px solid #333",
  },
  section: {
    marginBottom: "16px",
    paddingBottom: "12px",
    borderBottom: "1px solid #333",
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: "8px",
    color: "#fff",
  },
  controlRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "4px",
  },
  label: {
    minWidth: "16px",
    fontWeight: "500",
    color: "#fff",
  },
  value: {
    minWidth: "32px",
    textAlign: "right",
    fontVariantNumeric: "tabular-nums",
    color: "#fff",
  },
  input: {
    backgroundColor: "#333",
    border: "1px solid #555",
    borderRadius: "4px",
    color: "#fff",
    padding: "4px 8px",
    fontSize: "12px",
    outline: "none",
    width: "80px",
  },
  button: {
    backgroundColor: "#007acc",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "8px 16px",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    outline: "none",
    width: "100%",
    marginTop: "8px",
  },
  toggleButton: {
    backgroundColor: "#333",
    color: "#fff",
    border: "1px solid #555",
    borderRadius: "4px",
    padding: "8px 16px",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    outline: "none",
    width: "100%",
    marginBottom: "12px",
  },
} as const;

// Style tag for slider pseudo-elements, inputs, and buttons
const styleTag = `
  .controller-slider {
    flex: 1;
    cursor: pointer;
    -webkit-appearance: none;
    appearance: none;
    height: 4px;
    background: #333;
    border-radius: 2px;
    outline: none;
  }
  .controller-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #007acc;
    cursor: pointer;
  }
  .controller-slider::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #007acc;
    cursor: pointer;
    border: 1px solid #fff;
    box-sizing: border-box;
  }
  
  .controller-input {
    background-color: #333;
    border: 1px solid #555;
    border-radius: 4px;
    color: #fff;
    padding: 4px 8px;
    font-size: 12px;
    outline: none;
    width: 80px;
  }
  
  .controller-input:focus {
    border-color: #007acc;
  }

  .controller-button {
    background-color: #2563eb;
    color: #fff;
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    outline: none;
    width: 100%;
    margin-top: 8px;
    transition: background-color 0.2s;
  }

  .controller-button:hover {
    background-color: #2563eb;
  }

  .controller-toggle-button {
    background-color: #333;
    color: #fff;
    border: 1px solid #555;
    border-radius: 4px;
    padding: 8px 16px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    outline: none;
    width: 100%;
    margin-bottom: 12px;
    transition: all 0.2s;
  }

  .controller-toggle-button:hover {
    background-color: #444;
    border-color: #666;
  }
`;

export { styles, styleTag };