const dropArea = document.getElementById("dropArea");
const fileInput = document.getElementById("files");
const errorMessageDiv = document.getElementById("errorMessage");
const uploadedFiles = document.getElementById("uploadedFiles");

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, preventDefaults, false);
  document.body.addEventListener(eventName, preventDefaults, false);
});

['dragenter', 'dragover'].forEach(eventName => {
  dropArea.addEventListener(eventName, () => dropArea.classList.add('hover'), false);
});

['dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, () => dropArea.classList.remove('hover'), false);
});

dropArea.addEventListener('drop', handleDrop, false);
dropArea.addEventListener('click', () => fileInput.click(), false);

fileInput.addEventListener('change', () => { handleFiles(fileInput.files); }, false);

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;
  handleFiles(files);
}

async function handleFiles(files) {
  const MAX_FILE_SIZE = 300 * 1024 * 1024;
  const formData = new FormData();

  errorMessageDiv.textContent = '';
  uploadedFiles.innerHTML = '';

  if (files.length === 0) {
    errorMessageDiv.textContent = "No files uploaded.";
    return;
  }

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      errorMessageDiv.textContent = `File ${file.name} exceeds the maximum size of 300 MB.`;
      return;
    }

    formData.append('files', file);
  }

  const response = await fetch("/u", {
    method: "POST",
    body: formData,
  });

  const result = await response.json();

  if (result.error) {
    errorMessageDiv.textContent = result.error;
  }
  if (result.urls) {

    result.urls.forEach((url) => {
      const linkContainer = document.createElement('div');
      linkContainer.classList.add('linkContainer');
      const linkElement = document.createElement('a');
      linkElement.classList.add("linkElement");
      const linkFileName = document.createElement('span');
      linkFileName.classList.add("linkFileName");

      linkElement.href = url;
      linkElement.target = "_blank";
      linkElement.textContent = url;
      linkElement.onclick = (e) => {
        e.preventDefault();

        linkElement.textContent = 'Copied';
        linkElement.style.outline = '1px solid #007bff';
        linkElement.style.transition = 'all .5s ease-in-out';

        navigator.clipboard.writeText(linkElement.href).then(() => {

          setTimeout(() => {
            if (linkElement.textContent === 'Copied') {
              linkElement.textContent = url;
              linkElement.style.outline = '';
              setTimeout(() => { linkElement.style.transition = ''; }, 500);
            }
          }, 500);
        });

        return false;
      };

      [linkFileName, linkElement].forEach(i => { linkContainer.appendChild(i) });
      linkFileName.innerHTML = `File uploaded: ${files[result.urls.indexOf(url)].name} <br>`
      uploadedFiles.appendChild(linkContainer);
    });
  }
}
