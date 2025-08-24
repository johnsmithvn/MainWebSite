<System_Persona>
You will play the role of an expert software architect and a senior developer. Your task is to analyze my requirements and produce a comprehensive foundational document set for a new software project. You must think systematically, prioritize structure, maintainability, and clarity.
</System_Persona>

<Project_Brief>

</Project_Brief>

<Core_Instruction>
Based on the <Project_Brief>, perform the following tasks:

Create a detailed Big Design Up Front (BDUF) document. This document will serve as the single source of truth for the entire development process. All code produced in the future MUST strictly adhere to this document.

Create an initial README.md.

Create an initial CONTRIBUTION.md, including rules for AI participation.

Create an empty CHANGELOG.md.
</Core_Instruction>

<BDUF_Structure_Rubric>
The BDUF MUST include the following sections, each with detailed explanations:

Architecture Overview: A high-level description of the system architecture (e.g., Monolithic, Microservices), the main components, and how they interact.

Data Models: Detailed definitions for each data model or database entity, including fields, data types, and relationships (e.g., User, Habit, CompletionLog).

API Endpoints (if any): A list of RESTful API endpoints, including HTTP method (GET, POST, etc.), URL, request parameters, and the expected response structure.

File and Directory Structure: A tree representation of the proposed project directory structure, explaining the purpose of each main file and folder.

Key Functions/Classes: Descriptions of the most important classes and functions that will form the core logic of the application, including their responsibilities and method signatures.

Implementation Plan: A proposed step-by-step sequence to build the application, breaking the project down into manageable parts.
</BDUF_Structure_Rubric>

<Ancillary_Document_Generation>

README.md: Must include the Project Name, a brief Description, Installation Instructions (including dependencies such as requirements.txt), and Basic Usage Instructions.

CONTRIBUTION.md: Must include a section titled “Guidelines for AI Assistance” stating that AI must always reference the BDUF, adhere to the coding style (e.g., PEP 8 for Python), and propose changes to the BDUF rather than deviating from it on its own.

CHANGELOG.md: Must be initialized with a title and an entry for “Project Initialization.”
</Ancillary_Document_Generation>

<Output_Format>
Present each document (BDUF, README.md, CONTRIBUTION.md, CHANGELOG.md) in its own separate code block, clearly labeled with Markdown. For example:

BDUF
4.2 Prompt Anatomy: A Section-by-Section Analysis

Each component of the “Project Genesis” prompt is intentionally designed to steer the AI toward optimal outcomes.

<System_Persona>: This section sets the context for the AI. By specifying the role as an “expert software architect,” it will prioritize high-level design decisions and best practices rather than merely churning out code mechanically.

<Project_Brief>: This is the sole user-provided input. Clarity and detail here directly affect the quality of the generated documents.

<Core_Instruction>: This is the main command, specifying the deliverables (BDUF and ancillary documents). It emphasizes the importance of the BDUF as the “single source of truth,” a crucial directive for the AI’s future behavior.

<BDUF_Structure_Rubric>: This is arguably the most important part. Instead of merely asking for a “design document,” it provides an exact blueprint for that document. This forces the AI to think structurally about different aspects of the project—from data to API to file layout—ensuring a comprehensive plan.

<Ancillary_Document_Generation>: This section automates the creation of critical supporting documents, establishing a professional development environment from the outset. Including rules for AI in CONTRIBUTION.md is an advanced technique to program the AI’s own behavior.

<Output_Format>: This simple yet necessary directive ensures the results are well organized and easy for developers to copy into separate project files.

Part V: Execution and Iteration: Practical Guidance for Deploying the Framework
5.1 Step 0: Environment Setup

Before using the “Project Genesis” prompt, ensure the following prerequisites are met:

Enable the “Artifacts” feature in your Claude settings. This is crucial for persistently storing the BDUF. [1]

Set up your local development environment. This includes installing the necessary programming language (e.g., Python), package manager, and initializing a Git repository. [1]

Prepare your high-level project idea. Think carefully about what you want to build so you can effectively fill in the <Project_Brief> section.

5.2 Step 1: Initialization Interaction

Start a new project in Claude.

Copy the entire “Project Genesis” prompt template and fill in your project details in the <Project_Brief> section.

Send the prompt. Claude will generate the BDUF and other documents.

Review and Refine: Carefully read the generated documents. If anything is unclear or inaccurate, engage in a dialogue with Claude in the same conversation to refine them. For example: “In the Data Models section, add a last_login field to the User model.”

Critical Action: When you are satisfied with the final BDUF, copy its contents and save it as an attached artifact in your Claude project. Give it a meaningful name, e.g., project_bduf.md.

5.3 Step 2: Development Loop

Start a NEW conversation within the same project for each implementation task. This keeps context focused and prevents drift.

Draft a Referenced Prompt: Each code-generation prompt should begin by explicitly referencing the BDUF artifact.

Good example: “Referencing the Data Models section of project_bduf.md, create the Python SQLAlchemy class for the User model.”

Bad example: “Create a user class for me.”

Manage Code Locally: When Claude produces code, copy it into your local development environment. Use Git to commit changes frequently. This helps track progress and allows you to revert if the AI makes mistakes. Treat each AI work session as a mental pull request; you review and integrate code produced by a “teammate.” [1]

5.4 Step 3: Maintaining Project Health

Update the BDUF: If, during development, you realize the original architecture needs changes, don’t just ask the AI to change the code. Start a new “design” conversation and ask it to update the relevant BDUF section. Then replace the old artifact with the revised version. This ensures the single source of truth is always up to date.

Maintain CHANGELOG.md: After each significant development session, spend a moment updating the CHANGELOG.md. Record features added or changes made. This document acts as “session state” for your next AI interaction and is invaluable for tracking the project’s evolution. [1]

Understand the Source Code: Finally, it’s important to reiterate the caution from user Think_Different_1729. This method is not a shortcut to avoid learning. On the contrary, it works because it forces the developer to think like an architect and review code carefully. “Using Claude to write code you don’t understand is like copying an essay in school—you won’t learn anything, and the potential damage to your reputation may haunt you later.” [1] Use AI as a tool to accelerate execution, not as a substitute for understanding.
</Output_Format>