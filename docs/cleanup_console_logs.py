#!/usr/bin/env python3
"""
Script to remove console.log statements from TypeScript and TypeScript React files
while preserving console.error statements for error logging.
"""

import os
import re
import sys
from pathlib import Path
from typing import List, Tuple

# ANSI color codes for terminal output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def find_console_logs(content: str) -> List[Tuple[int, str]]:
    """Find all console.log statements in the content."""
    console_logs = []
    lines = content.split('\n')
    
    for i, line in enumerate(lines):
        # Match console.log statements (but not console.error, console.warn, etc.)
        if re.search(r'console\.log\s*\(', line):
            console_logs.append((i + 1, line.strip()))
    
    return console_logs

def remove_console_logs(content: str) -> Tuple[str, int]:
    """Remove console.log statements from content."""
    lines = content.split('\n')
    modified_lines = []
    removed_count = 0
    
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Check if line contains console.log
        if re.search(r'console\.log\s*\(', line):
            # Handle multi-line console.log statements
            if line.strip().startswith('console.log'):
                # Count opening and closing parentheses
                open_parens = line.count('(')
                close_parens = line.count(')')
                
                # If parentheses are not balanced, it's a multi-line statement
                while open_parens > close_parens and i + 1 < len(lines):
                    i += 1
                    open_parens += lines[i].count('(')
                    close_parens += lines[i].count(')')
                
                # Replace with a comment or remove entirely
                indent = len(line) - len(line.lstrip())
                # Skip adding anything (remove the line entirely)
                removed_count += 1
            else:
                # console.log is part of a larger line, just remove the console.log call
                modified_line = re.sub(r'console\.log\s*\([^;]*\);?', '', line)
                if modified_line.strip():  # If there's still content on the line
                    modified_lines.append(modified_line)
                removed_count += 1
        else:
            modified_lines.append(line)
        
        i += 1
    
    return '\n'.join(modified_lines), removed_count

def process_file(file_path: Path) -> Tuple[bool, int]:
    """Process a single file to remove console.log statements."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find console.logs before processing
        console_logs = find_console_logs(content)
        
        if not console_logs:
            return False, 0
        
        # Remove console.logs
        modified_content, removed_count = remove_console_logs(content)
        
        # Write back to file
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(modified_content)
        
        return True, removed_count
    
    except Exception as e:
        print(f"{Colors.FAIL}Error processing {file_path}: {e}{Colors.ENDC}")
        return False, 0

def find_files_with_console_logs(root_dir: Path) -> List[Path]:
    """Find all .ts and .tsx files containing console.log statements."""
    files_with_logs = []
    
    for ext in ['*.ts', '*.tsx']:
        for file_path in root_dir.rglob(ext):
            # Skip node_modules, .next, and other build directories
            if any(part in file_path.parts for part in ['node_modules', '.next', 'dist', 'build', '.git']):
                continue
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if re.search(r'console\.log\s*\(', content):
                        files_with_logs.append(file_path)
            except Exception:
                continue
    
    return files_with_logs

def main():
    """Main function to run the cleanup."""
    # Get the project root directory
    project_root = Path('/Users/gopal/BlindsCode/blindscommerce')
    
    if not project_root.exists():
        print(f"{Colors.FAIL}Error: Project directory not found: {project_root}{Colors.ENDC}")
        sys.exit(1)
    
    print(f"{Colors.HEADER}{'='*60}")
    print(f"Console.log Cleanup Script")
    print(f"{'='*60}{Colors.ENDC}")
    print(f"Project root: {project_root}")
    print()
    
    # Find all files with console.log statements
    print(f"{Colors.OKBLUE}Scanning for files with console.log statements...{Colors.ENDC}")
    files_with_logs = find_files_with_console_logs(project_root)
    
    if not files_with_logs:
        print(f"{Colors.OKGREEN}No files with console.log statements found!{Colors.ENDC}")
        return
    
    print(f"{Colors.WARNING}Found {len(files_with_logs)} files with console.log statements{Colors.ENDC}")
    print()
    
    # Process each file
    total_removed = 0
    processed_files = 0
    
    for file_path in files_with_logs:
        relative_path = file_path.relative_to(project_root)
        print(f"{Colors.OKCYAN}Processing: {relative_path}{Colors.ENDC}")
        
        # Find and display console.logs in this file
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        console_logs = find_console_logs(content)
        if console_logs:
            for line_num, line_content in console_logs[:3]:  # Show first 3
                print(f"  Line {line_num}: {Colors.FAIL}{line_content[:80]}{'...' if len(line_content) > 80 else ''}{Colors.ENDC}")
            if len(console_logs) > 3:
                print(f"  ... and {len(console_logs) - 3} more")
        
        # Process the file
        success, removed_count = process_file(file_path)
        
        if success:
            print(f"  {Colors.OKGREEN}✓ Removed {removed_count} console.log statement(s){Colors.ENDC}")
            total_removed += removed_count
            processed_files += 1
        else:
            print(f"  {Colors.FAIL}✗ Failed to process file{Colors.ENDC}")
        
        print()
    
    # Final summary
    print(f"{Colors.HEADER}{'='*60}")
    print(f"Cleanup Summary")
    print(f"{'='*60}{Colors.ENDC}")
    print(f"{Colors.OKGREEN}Files processed: {processed_files}/{len(files_with_logs)}")
    print(f"Total console.log statements removed: {total_removed}{Colors.ENDC}")
    
    # Verify cleanup
    print()
    print(f"{Colors.OKBLUE}Verifying cleanup...{Colors.ENDC}")
    remaining_files = find_files_with_console_logs(project_root)
    
    if remaining_files:
        print(f"{Colors.WARNING}Warning: {len(remaining_files)} files still contain console.log statements{Colors.ENDC}")
        for file_path in remaining_files[:5]:
            print(f"  - {file_path.relative_to(project_root)}")
        if len(remaining_files) > 5:
            print(f"  ... and {len(remaining_files) - 5} more")
    else:
        print(f"{Colors.OKGREEN}Success! All console.log statements have been removed.{Colors.ENDC}")

if __name__ == "__main__":
    main()