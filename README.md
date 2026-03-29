# CoopLoan Manager (Bank Loan Management)

Welcome to the CoopLoan Manager! This is a comprehensive, full-stack Next.js web application designed for cooperative banking and loan management. It handles user memberships, loan applications, financial ledgering, automated payment calculations, and AI-powered auditing.

## 🛠️ Technology Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB with `mongoose` for object modeling
- **Styling**: Tailwind CSS + Radix UI headless components
- **Authentication**: Custom secure JWT authentication (`jose`) and secure password hashing (`bcrypt`)
- **Data Tables & Charts**: Tanstack Table (data grids) and Recharts (dashboards)
- **AI Integrations**: Google Genkit for built-in AI auditing tools

## 📂 System Architecture
The application features distinct user paths:
- **Public**: Login, Signup, New Membership applications, and an interactive Loan Calculator.
- **Member Dashboard**: Personal financial overview, active loan tracking, profile configuration, and secure loan modification requests.
- **Admin Interface**: Powerful suite for membership approvals, ledger management, profit/loss statements, dividends, and an AI Audit tool.

---

## 📈 Bulk Data Import Workflow
Administrators can rapidly migrate user records and legacy data from standard Excel sheets using the **Bulk Import Tooling** located within the Admin Dashboard (`/admin/bulk-import`).

### 1. Excel Structure to Maintain
Your imported file must be a standard `.xlsx` spreadsheet. 
Our importer engine intelligently handles messy files (for instance, automatically ignoring giant title headers on the first row) and looks specifically for your actual data column headers.

To assure 100% accuracy, you should maintain the following column names (spaces are completely fine and expected):
- `MEMBERSHIP NUMBER` **(Required)**
- `NAME` **(Required)**
- `MOBILE NUMBER` **(Required)**
- `EMAIL`
- `STATUS` (active, inactive, retired)
- `MEMBERSHIP DATE`
- `WORKPLACE` or `NAME OF OFFICE`
- `PROFESSION` or `DESIGNATION`
- `WORKPLACE ADDRESS`
- `PERSONAL ADDRESS` or `ADDRESS OF MEMBER`
- `BANK ACCOUNT NUMBER`
- `AGE`
- `GENDER`
- `NAME OF NOMINEE` or `NOMINEE NAME`
- `RELATIONSHIP` or `NOMINEE RELATION`
- `NOMINEE AGE`
- **Fund/Loan details**: `SHARE FUND`, `GUARANTEED FUND`, `THRIFT FUND`, `ORIGINAL LOAN AMOUNT`, `CURRENT OUTSTANDING PRINCIPAL`, `INTEREST RATE`, `MONTHLY PAYMENT`, `TENURE MONTHS`.

### 2. How to Upload Data
1. Log in with an Admin account.
2. Navigate to your Admin Dashboard and click on the **Bulk Import** route.
3. Select and choose your `.xlsx` files to be uploaded into their respective Member, Funds, or Loan fields.
4. Process the upload.

### 3. What Happens After Upload?
Once you trigger the upload, our server seamlessly processes the Excel file:
1. **Identities are Verified**: The system screens all columns, ignoring empty entries or users missing crucial ID markers seamlessly.
2. **User Accounts are Created**: Every valid member is written directly into the Mongo Database as an actively authenticated User under the `member` role.
3. **Ledgers are Formed**: Thrift, Share, and Guaranteed Funds are populated. Active loan ledgers are constructed directly under the members' accounts, configuring their financial balances and interest obligations immediately.
4. **Summary Feedback**: The admin interface presents a success overview detailing exactly how many Members, Funds, and Loans were successfully created or updated. 

### 4. What Password Will The User Get?
For total onboarding simplicity, entirely new members imported from this tool will dynamically receive a **temporary default password** taking the below format:
> `password[MembershipNumber]`

**Example**: If a user's `MEMBERSHIP NUMBER` in your Excel sheet is `4581`, their initial secure login password will literally be `password4581`.

**🔐 Security Enforced:**
Our system heavily enforces security for these new users. Every imported profile is automatically flagged with `requiresPasswordChange: true`. Upon their very first login with their temporary password, they will be strictly redirected to securely change their password *before* gaining arbitrary access into their member dashboard.

---
*Created dynamically for CoopLoan Manager Administration setup.*
