"use client";

import { useState, useEffect } from "react";
import styles from "@/styles/data.module.css";
import Navbar from "@/app/components/Navbar";

interface UploadedFile {
  fileId: string;
  filename: string;
}

// Sample demo data (consistent across pages)
const DEMO_DATA = `User Interview Highlights:
- "I didn't realise I was halfway through. Some kind of progress bar would help."
- "The technical questions felt good, but I wasn't sure how well I did."
- "I dropped off because I didn't get any feedback after the first few questions."

Support Tickets & Themes:
- Repeated requests for saving partial progress
- Confusion around the skill categories
- Several users asked for practice sessions before full assessments

A/B Test Results:
- Guided onboarding flow vs standard: 21% increase in completion
- Adding a short dashboard summary after first 3 questions: 17% drop in bounce
- Email reminders led to 14% higher return rate within 48 hours

Product Usage Data:
- Average user attempts 1.3 assessments
- 56% of users stop before finishing their first full one
- Average time on site: 6m 42s`;

const DEMO_FILE = {
  fileId: "demo_file_001",
  filename: "demo_research_notes.txt",
  content: "This is a demo file with research notes for testing the file upload functionality."
};

export default function DataPage() {
  const [data, setData] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pendingUpload, setPendingUpload] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  // Load saved data and files on component mount
  useEffect(() => {
    // Check if demo mode was previously enabled
    const isDemoEnabled = localStorage.getItem("discovr_demo_mode") === "true";
    setDemoMode(isDemoEnabled);
    
    if (isDemoEnabled) {
      // If demo mode is enabled, ensure we're showing the demo data even if localStorage is different
      setData(DEMO_DATA);
      
      // Ensure demo file is shown
      try {
        const demoFiles = [DEMO_FILE];
        setUploadedFiles(demoFiles);
      } catch (error) {
        console.error("Error setting demo files:", error);
      }
    } else {
      // Load saved data if not in demo mode
      const savedData = localStorage.getItem("discovr_data");
      const savedFiles = localStorage.getItem("discovr_uploaded_files_meta");
      
      if (savedData) {
        setData(savedData);
      }
      
      if (savedFiles) {
        try {
          setUploadedFiles(JSON.parse(savedFiles));
        } catch (error) {
          console.error("Error parsing saved files:", error);
        }
      }
    }
  }, []);

  // Toggle demo mode function
  const toggleDemoMode = () => {
    const newDemoMode = !demoMode;
    setDemoMode(newDemoMode);

    // Store demo mode state in localStorage
    localStorage.setItem("discovr_demo_mode", newDemoMode.toString());
    
    if (newDemoMode) {
      // Enable demo mode - save demo data to localStorage
      localStorage.setItem("discovr_data", DEMO_DATA);
      
      // Demo strategy and metrics
      const DEMO_STRATEGY = "Our product helps recent computer science graduates land their first tech job by identifying skill gaps and matching them with personalised interview prep and micro-assessments. Our goal is to reduce the average job search time for junior candidates.";
      const DEMO_METRICS = [
        "Increase assessment completion rate to 70%",
        "Reduce dropout between signup and first interview by 30%",
        "Boost candidate-to-hire ratio from 8% to 12%",
        "Improve average job offer timeline from 8 weeks to 5 weeks"
      ];
      localStorage.setItem("discovr_strategy", DEMO_STRATEGY);
      localStorage.setItem("discovr_metrics", JSON.stringify(DEMO_METRICS));
      
      // Add demo file
      const demoFiles = [DEMO_FILE];
      localStorage.setItem("discovr_uploaded_files_meta", JSON.stringify(demoFiles));
      
      // Create a mock file structure for the demo file
      const demoFileContent = DEMO_FILE.content;
      const demoFileBlob = new Blob([demoFileContent], { type: 'text/plain' });
      const demoFilesList = [{
        fileId: DEMO_FILE.fileId,
        file: demoFileBlob,
        filename: DEMO_FILE.filename
      }];
      localStorage.setItem("discovr_uploaded_files", JSON.stringify(demoFilesList));

      // Update state - ensure text area is populated with demo data
      setData(DEMO_DATA);
      setUploadedFiles(demoFiles);
      setPendingUpload(null);
    } else {
      // Disable demo mode - clear localStorage
      localStorage.removeItem("discovr_strategy");
      localStorage.removeItem("discovr_metrics");
      localStorage.removeItem("discovr_data");
      localStorage.removeItem("discovr_uploaded_files_meta");
      localStorage.removeItem("discovr_uploaded_files");
      
      // Reset state
      setData("");
      setUploadedFiles([]);
      setPendingUpload(null);
    }
  };

  const showMessage = (message: string) => {
    setSaveMessage(message);
    setTimeout(() => {
      setSaveMessage("");
    }, 2000);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const allowedTypes = [".txt", ".csv", ".pdf"];
    const fileExtension = file.name.substring(file.name.lastIndexOf("."));
    if (!allowedTypes.includes(fileExtension.toLowerCase())) {
      showMessage("Invalid file type");
      return;
    }

    setSelectedFile(file);
    setPendingUpload(file.name);
    // Reset file input
    event.target.value = "";
  };

  const handleGenerateQuestions = () => {
    console.log("Generating suggested questions...");
    // Question generation logic will be implemented later
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    // Check file type
    const allowedTypes = [".txt", ".csv", ".pdf"];
    const fileExtension = file.name.substring(file.name.lastIndexOf("."));
    if (!allowedTypes.includes(fileExtension.toLowerCase())) {
      showMessage("Invalid file type");
      return;
    }

    setSelectedFile(file);
    setPendingUpload(file.name);
  };

  return (
    <div className={styles.container}>
      <Navbar />

      <div className={styles.card}>
        <div className={styles.pageHeader}>
          <h1 className={styles.heading}>📂 Upload Your Data</h1>
          <div className={styles.demoToggleContainer}>
            <label htmlFor="dataDemoMode" className={styles.demoModeLabel}>
              Demo Mode
              <div className={styles.toggleSwitch}>
                <input
                  type="checkbox"
                  id="dataDemoMode"
                  checked={demoMode}
                  onChange={toggleDemoMode}
                  className={styles.toggleInput}
                />
                <span className={styles.toggleSlider}></span>
              </div>
            </label>
          </div>
        </div>

        <div className={styles.inputSection}>
          <h2 className={styles.subheading}>Paste Text</h2>
          <textarea
            className={styles.textarea}
            value={data}
            onChange={(e) => setData(e.target.value)}
            placeholder="Paste your notes, transcripts, A/B test results, or research snippets here..."
            disabled={isLoading}
          />
          <div className={styles.buttonContainer}>
            <button
              className={`${styles.button} ${styles.clearButton}`}
              onClick={() => setData("")}
              disabled={isLoading || !data.trim()}
            >
              Clear Text
            </button>
            <button
              className={styles.button}
              onClick={async () => {
                if (!data.trim()) return;
                setIsLoading(true);
                try {
                  // Save to localStorage
                  localStorage.setItem("discovr_data", data);

                  showMessage("Text Saved!");
                } catch (error) {
                  console.error("Error saving text:", error);
                  showMessage("Error saving text");
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading || !data.trim()}
            >
              Save Text
            </button>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.inputSection}>
          <h2 className={styles.subheading}>Upload File</h2>
          <div
            className={`${styles.fileUploadContainer} ${
              isDragging ? styles.dragging : ""
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-upload"
              className={styles.fileInput}
              accept=".txt,.csv,.pdf"
              onChange={handleFileSelect}
              disabled={isLoading}
            />
            <label htmlFor="file-upload" className={styles.fileUploadLabel}>
              <span className={styles.fileUploadText}>
                Choose a file or drag it here
              </span>
              <span className={styles.fileUploadHint}>
                Supports .txt, .csv, or .pdf files
              </span>
            </label>
          </div>
          {pendingUpload && (
            <div className={styles.pendingUpload}>
              <span className={styles.fileIcon}>📄</span>
              <span className={styles.fileName}>{pendingUpload}</span>
              <span className={styles.uploadStatus}>Pending</span>
            </div>
          )}
          {uploadedFiles.length > 0 && (
            <div className={styles.uploadedFiles}>
              <h3 className={styles.uploadedFilesHeading}>Recent Uploads:</h3>
              <div className={styles.filesList}>
                {uploadedFiles.slice(-3).map((file) => (
                  <div key={file.fileId} className={styles.fileItem}>
                    <span className={styles.fileIcon}>📄</span>
                    <span className={styles.fileName}>{file.filename}</span>
                    <span className={styles.uploadStatus}>✓ Uploaded</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className={styles.buttonContainer}>
            <button
              className={styles.button}
              onClick={async () => {
                if (!selectedFile) return;
                setIsLoading(true);
                try {
                  const formData = new FormData();
                  formData.append("file", selectedFile);

                  const response = await fetch("/api/data/upload-file", {
                    method: "POST",
                    body: formData,
                  });

                  if (!response.ok) {
                    throw new Error("Failed to upload file");
                  }

                  const result = await response.json();

                  // Add to uploaded files list
                  const newFile = {
                    fileId: result.fileId,
                    filename: result.filename,
                  };

                  const updatedFiles = [...uploadedFiles, newFile];
                  setUploadedFiles(updatedFiles);

                  // Save to localStorage
                  localStorage.setItem(
                    "discovr_uploaded_files_meta",
                    JSON.stringify(updatedFiles)
                  );

                  // Add file to the uploaded files array with the blob data
                  const fileReader = new FileReader();
                  fileReader.onload = function (fileLoadedEvent) {
                    const dataUrl = fileLoadedEvent.target?.result;
                    const filesList = JSON.parse(
                      localStorage.getItem("discovr_uploaded_files") || "[]"
                    );
                    filesList.push({
                      fileId: result.fileId,
                      filename: result.filename,
                      blob: dataUrl,
                    });
                    localStorage.setItem(
                      "discovr_uploaded_files",
                      JSON.stringify(filesList)
                    );
                  };
                  fileReader.readAsDataURL(selectedFile);

                  setPendingUpload(null);
                  setSelectedFile(null);
                  showMessage("File Uploaded!");
                } catch (error) {
                  console.error("Error uploading file:", error);
                  showMessage("Error uploading file");
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading || !selectedFile}
            >
              Upload File
            </button>
          </div>
        </div>

        {saveMessage && (
          <div className={styles.saveMessageContainer}>
            <span className={styles.saveMessage}>{saveMessage}</span>
          </div>
        )}

        <div className={styles.divider} />

        <div className={styles.helpSection}>
          <h2 className={styles.helpHeading}>
            🧪 Help Me Design Interviews & Experiments
          </h2>
          <p className={styles.helpText}>
            Not sure what data to capture? Let Discovr guide you.
          </p>
          <button
            className={styles.button}
            onClick={handleGenerateQuestions}
            disabled={true}
            style={{ opacity: 0.5, cursor: "not-allowed" }}
          >
            Generate Interview Questions
            <span
              style={{ display: "block", fontSize: "0.8em", marginTop: "4px" }}
            >
              (Coming soon!)
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
