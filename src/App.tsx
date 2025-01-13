import CodeInput from './components/codeInput';

const App = () => {
  return (
    <div className="min-h-screen bg-gray-800 text-white">
      <div className="bg-gray-900 shadow-lg p-8 rounded-lg max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center text-white">AI Code Review System</h1>
        <p className="text-lg text-gray-400 mb-8 text-center">
          Analyze the accuracy and comprehensiveness of code reviewers' feedback.
        </p>
        <CodeInput />
      </div>
    </div>
  );
};

export default App;
