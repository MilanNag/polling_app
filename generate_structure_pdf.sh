#!/bin/bash

# Check if pandoc is installed
if ! command -v pandoc &> /dev/null; then
    echo "Pandoc is required to generate PDF. Please install it first."
    echo "You can typically install it with: npm install -g pandoc"
    exit 1
fi

# Generate the project structure diagram using tree command
echo "Generating project structure diagram..."
echo '```' > structure_temp.md
echo '' >> structure_temp.md
find . -type f -not -path "*/node_modules/*" -not -path "*/\.*" | sort >> structure_temp.md
echo '```' >> structure_temp.md

# Combine with existing project structure document
echo "Creating combined document..."
cat PROJECT_STRUCTURE.md structure_temp.md > project_structure_with_tree.md

# Convert to PDF using pandoc
echo "Converting to PDF..."
pandoc project_structure_with_tree.md -o PROJECT_STRUCTURE.pdf

# Clean up temporary files
rm structure_temp.md project_structure_with_tree.md

echo "PDF generated as PROJECT_STRUCTURE.pdf"