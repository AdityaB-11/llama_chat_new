import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import CodeBlock from './CodeBlock';
import InlineCode from './InlineCode';
import '../styles/message-content.css';

// Test the code block parser with some examples
const testParser = () => {
  const testCases = [
    {
      name: "Basic code block",
      content: "```javascript\nconst x = 1;\n```"
    },
    {
      name: "Code block without language",
      content: "```\nplain text\n```"
    },
    {
      name: "Code block with text before and after",
      content: "Text before\n```javascript\nconst x = 1;\n```\nText after"
    },
    {
      name: "Inline code",
      content: "Here is `inline code`"
    },
    {
      name: "Multiple code blocks",
      content: "```javascript\nconst x = 1;\n```\n\n```python\nprint('hello')\n```"
    },
    {
      name: "Code block without newlines",
      content: "```javascript\nconst x = 1;```"
    }
  ];

  console.log("RUNNING CODE BLOCK PARSER TESTS");
  testCases.forEach(test => {
    console.log(`Test: ${test.name}`);
    const regex = /```([\w-]*)?(?:\s*\n)?([\s\S]+?)(?:\n)?```/g;
    const matches = [...test.content.matchAll(regex)];
    console.log("Matches:", matches);
  });
  console.log("END OF TESTS");
};

const MessageContent = ({ content }) => {
  useEffect(() => {
    // Run the test parser once
    if (content && content.includes("RUN_CODE_BLOCK_TEST")) {
      testParser();
    }
  }, [content]);

  // This function parses content to find code blocks with ```language notation
  const parseCodeBlocks = () => {
    if (!content) return [{ type: 'text', content: '' }];

    console.log("Parsing content for code blocks:", content);

    // Updated regex to be more flexible with spacing and newlines
    const codeBlockRegex = /```([\w-]*)?(?:\s*\n)?([\s\S]+?)(?:\n)?```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      console.log("Found code block match:", match);
      
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.substring(lastIndex, match.index)
        });
      }

      // Add code block with proper trimming to remove extra whitespace
      parts.push({
        type: 'code',
        language: (match[1] || '').trim(),
        content: match[2].trim()
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex)
      });
    }

    console.log("Parsed parts:", parts);
    return parts;
  };

  // Custom renderer for ReactMarkdown to handle inline code
  const renderers = {
    code({ node, inline, className, children, ...props }) {
      console.log("ReactMarkdown code renderer called:", { inline, children });
      // This handles inline code wrapped in single backticks
      if (inline) {
        return <InlineCode code={children} />;
      }
      return <code className={className} {...props}>{children}</code>;
    }
  };

  const renderParts = () => {
    const parts = parseCodeBlocks();
    
    return parts.map((part, index) => {
      if (part.type === 'code') {
        console.log("Rendering code block part:", part);
        return (
          <CodeBlock 
            key={index} 
            code={part.content} 
            language={part.language} 
          />
        );
      } else {
        console.log("Rendering text part:", part);
        return (
          <div key={index} className="text-content">
            <ReactMarkdown components={renderers}>{part.content}</ReactMarkdown>
          </div>
        );
      }
    });
  };

  return (
    <div className="message-content">
      {renderParts()}
    </div>
  );
};

export default MessageContent; 