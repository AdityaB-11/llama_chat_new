import React from 'react';
import MessageContent from './MessageContent';
import '../styles/demo-page.css';

const DemoPage = () => {
  const demoContent = `
# Code Block Examples

Here are some examples of how code blocks render:

## JavaScript Example
\`\`\`javascript
function helloWorld() {
  console.log("Hello, world!");
  return true;
}

// This is a comment
const obj = {
  name: "JavaScript",
  version: "ES2022",
  features: ["classes", "arrow functions", "destructuring"]
};

helloWorld();
\`\`\`

You can also use \`inline code\` within paragraphs.

## Python Example
\`\`\`python
def factorial(n):
    if n == 0:
        return 1
    else:
        return n * factorial(n-1)
        
# Calculate factorial of 5
result = factorial(5)
print(f"The factorial of 5 is {result}")
\`\`\`

## HTML Example
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hello World</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Hello, World!</h1>
        <p>This is a simple HTML page.</p>
    </div>
</body>
</html>
\`\`\`

## No Language Specified
\`\`\`
This is a code block with no language specified.
It will be displayed as plain text.
const a = 1;
function test() {}
\`\`\`

Here's some text with \`multiple inline code\` elements in it. You can use these to highlight \`variable names\`, \`functions()\`, or other code references.
`;

  const handleBackClick = () => {
    window.api.navigateTo('app');
  };

  return (
    <div className="demo-page">
      <div className="demo-header">
        <h1>Code Block Demo</h1>
        <button className="back-button" onClick={handleBackClick}>
          Back to Chat
        </button>
      </div>
      <div className="demo-container">
        <MessageContent content={demoContent} />
      </div>
    </div>
  );
};

export default DemoPage; 