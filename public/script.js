const postForm = document.getElementById('postForm');
const message = document.getElementById('message');
const postsContainer = document.getElementById('posts');
const loadPostsBtn = document.getElementById('loadPostsBtn');
const postIdInput = document.getElementById('postId');
const formHeading = document.getElementById('formHeading');
const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

function setMessage(text, color) {
  message.textContent = text;
  message.style.color = color;
}

function resetForm() {
  postForm.reset();
  postIdInput.value = '';
  formHeading.textContent = 'Create a Blog Post';
  submitBtn.textContent = 'Add Post';
  cancelEditBtn.classList.add('hidden');
}

async function loadPosts() {
  const response = await fetch('/api/posts');
  const posts = await response.json();

  postsContainer.innerHTML = '';

  if (!posts.length) {
    postsContainer.innerHTML = '<p class="empty-state">No posts yet. Create the first one.</p>';
    return;
  }

  posts.forEach((post) => {
    const postElement = document.createElement('div');
    postElement.className = 'post';
    postElement.innerHTML = `
      <h3>${post.title}</h3>
      <p>${post.content}</p>
      <div class="post-actions">
        <button type="button" class="edit-btn" data-id="${post._id}" data-title="${encodeURIComponent(post.title)}" data-content="${encodeURIComponent(post.content)}">Edit</button>
        <button type="button" class="delete-btn danger" data-id="${post._id}">Delete</button>
      </div>
    `;
    postsContainer.appendChild(postElement);
  });
}

postForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const postId = postIdInput.value.trim();
  const title = document.getElementById('title').value.trim();
  const content = document.getElementById('content').value.trim();
  const method = postId ? 'PUT' : 'POST';
  const url = postId ? `/api/posts/${postId}` : '/api/posts';

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, content }),
  });

  const result = await response.json();

  if (!response.ok) {
    setMessage(result.message, '#dc2626');
    return;
  }

  setMessage(result.message, '#16a34a');
  resetForm();
  await loadPosts();
});

postsContainer.addEventListener('click', async (event) => {
  const editButton = event.target.closest('.edit-btn');
  const deleteButton = event.target.closest('.delete-btn');

  if (editButton) {
    postIdInput.value = editButton.dataset.id;
    document.getElementById('title').value = decodeURIComponent(editButton.dataset.title);
    document.getElementById('content').value = decodeURIComponent(editButton.dataset.content);
    formHeading.textContent = 'Edit Blog Post';
    submitBtn.textContent = 'Update Post';
    cancelEditBtn.classList.remove('hidden');
    setMessage('Editing selected post.', '#2563eb');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  if (deleteButton) {
    const confirmed = window.confirm('Do you want to delete this post?');

    if (!confirmed) {
      return;
    }

    const response = await fetch(`/api/posts/${deleteButton.dataset.id}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.message, '#dc2626');
      return;
    }

    setMessage(result.message, '#16a34a');
    if (postIdInput.value === deleteButton.dataset.id) {
      resetForm();
    }
    await loadPosts();
  }
});

cancelEditBtn.addEventListener('click', () => {
  resetForm();
  setMessage('Edit cancelled.', '#2563eb');
});

loadPostsBtn.addEventListener('click', loadPosts);
window.addEventListener('DOMContentLoaded', () => {
  resetForm();
  loadPosts();
});
