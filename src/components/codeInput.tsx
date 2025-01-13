import { useState } from 'react';
import { getCodeErrors } from '../../request.ts';
import { getReviewerClassification } from '../../classify.ts';

const CodeInput = () => {
  const [code, setCode] = useState('');
  const [reviewerComments, setReviewerComments] = useState('');
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          setCode(event.target.result); // Set code content from the file
        }
      };
      reader.readAsText(file);

    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Get the errors from the code first
      await getCodeErrors(code, async (errors) => {
        // After identifying errors, classify the reviewer performance based on the errors and the reviewer comments
        await getReviewerClassification({ errors, comments: reviewerComments, setClassification: (classification: string | undefined) => {
          setResult(classification ?? 'No classification available');
        }});
      });
    } catch (error) {
      setResult('Failed to analyze the code.');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Code textarea */}
      <textarea
        className="w-full p-4 bg-gray-700 text-white rounded-lg shadow-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={10}
        placeholder="Paste your code here..."
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />

      {/* File upload input */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-gray-300">Or upload a code file</label>
        <input
          type="file"
          className="p-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none"
          accept=".js,.py,.java,.txt,.cpp,.html,.css"
          onChange={handleFileChange}
        />
      </div>

      {/* Reviewer comments input */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-gray-300">Reviewer's Comments</label>
        <textarea
          className="w-full p-4 bg-gray-700 text-white rounded-lg shadow-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={6}
          placeholder="Paste the reviewer's comments here..."
          value={reviewerComments}
          onChange={(e) => setReviewerComments(e.target.value)}
        />
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md shadow-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        {loading ? 'Analyzing...' : 'Analyze Code'}
      </button>

      {/* Displaying Result */}
      <div className="mt-6 p-4 bg-gray-700 rounded-lg shadow-md">
        <h3 className="font-semibold text-lg text-white">Reviewer Performance :</h3>
        <p className="text-gray-300 mt-2">{result}</p>
      </div>
    </div>
  );
};

export default CodeInput;
