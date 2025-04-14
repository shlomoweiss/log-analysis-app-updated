# Log Analysis Application - User Guide

This document provides instructions for using the Log Analysis Application to interrogate logs stored in Elasticsearch using natural language queries.

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Using Natural Language Queries](#using-natural-language-queries)
4. [Viewing Results](#viewing-results)
5. [Managing Saved Queries](#managing-saved-queries)
6. [Query History](#query-history)
7. [User Settings](#user-settings)
8. [Administrator Functions](#administrator-functions)

## Introduction

The Log Analysis Application allows you to search and analyze logs stored in Elasticsearch using natural language queries. The system translates your human-readable questions into Elasticsearch query language, executes the search, and displays the results in a user-friendly manner.

## Getting Started

### Accessing the Application

1. Open your web browser and navigate to the application URL
2. Log in with your credentials
   - For demo purposes, you can use: Username: `admin` / Password: `password`

### Dashboard Overview

The main dashboard consists of:
- Query input area
- Timeline visualization
- Results table
- Navigation menu for accessing other features

## Using Natural Language Queries

### Writing Effective Queries

You can ask questions in plain English. Here are some examples:

- "Show me all error logs from the payment service in the last 24 hours"
- "Find warning messages in the authentication service from the past week"
- "Display logs containing database connection issues in the last hour"
- "Show me all logs from the order service with status code 500"

### Query Components

Your queries can include:

1. **Time ranges**:
   - "last hour", "past 6 hours", "last 24 hours", "past week", "last month"

2. **Log levels**:
   - ERROR, WARNING, INFO, DEBUG

3. **Services**:
   - payment, user, authentication, order

4. **Content filters**:
   - "containing [text]", "with message [text]"

### Executing Queries

1. Type your natural language query in the input box
2. Click "Execute Query" or press Enter
3. The system will translate your query to Elasticsearch DSL and execute it
4. You can view the translated query by clicking "Show Translation"

## Viewing Results

### Results Table

The results table displays:
- Timestamp of each log entry
- Log level (ERROR, WARNING, INFO, DEBUG)
- Service name
- Log message

You can:
- Sort results by clicking column headers
- Filter results using the filter boxes
- Drill down into specific log entries by clicking on them

### Timeline Visualization

The timeline visualization shows:
- Distribution of logs over time
- Color-coded representation of log levels
- Patterns and spikes in log activity

## Managing Saved Queries

### Saving a Query

1. Enter a query in the input box
2. Click "Save Current Query"
3. Enter a name for the query
4. Click "Save"

### Using Saved Queries

1. Navigate to the "Saved Queries" page
2. View your list of saved queries
3. Click "View" to see details of a saved query
4. Click "Execute" to run the saved query

## Query History

The Query History page shows:
- Your recently executed queries
- Timestamp of execution
- Number of results returned

You can:
- Re-run previous queries
- Save queries from your history
- Clear your query history

## User Settings

In the Settings page, you can:
- Change your password
- Set your preferred theme (Light/Dark)
- Configure default time range for queries
- Set results per page
- Enable/disable notifications

## Administrator Functions

Administrators have additional capabilities:
- User management (create, edit, delete users)
- Role assignment
- System monitoring
- Audit log review

To access admin functions:
1. Log in with an admin account
2. Navigate to the admin section from the settings page
