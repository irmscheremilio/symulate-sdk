import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// Import Symulate configuration
import './symulate.config';

// Import collections and types
import { users, posts, comments } from './api/collections';
import type { User } from './api/schemas/user.schema';
import type { Post } from './api/schemas/post.schema';
import type { Comment } from './api/schemas/comment.schema';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'Level 2: Moderate Mocking';

  // State
  users: User[] = [];
  selectedUser: User | null = null;
  userPosts: Post[] = [];
  selectedPost: Post | null = null;
  postComments: Comment[] = [];
  loading = false;
  error: string | null = null;

  async ngOnInit() {
    await this.loadUsers();
  }

  async loadUsers() {
    try {
      this.loading = true;
      this.error = null;
      const response = await users.list();
      this.users = response.data;
    } catch (err) {
      this.error = 'Failed to load users';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  async selectUser(userId: string) {
    try {
      this.loading = true;
      this.error = null;

      // Load user details
      const user = await users.get(userId);
      this.selectedUser = user;

      // Load user's posts (filter by userId)
      const postsResponse = await posts.list({ filter: { userId } });
      this.userPosts = postsResponse.data;

      // Clear selected post when switching users
      this.selectedPost = null;
      this.postComments = [];
    } catch (err) {
      this.error = 'Failed to load user details';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  async selectPost(postId: string) {
    try {
      this.loading = true;
      this.error = null;

      // Load post details
      const post = await posts.get(postId);
      this.selectedPost = post;

      // Load post comments (filter by postId)
      const commentsResponse = await comments.list({ filter: { postId } });
      this.postComments = commentsResponse.data;
    } catch (err) {
      this.error = 'Failed to load post details';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  goBack() {
    if (this.selectedPost) {
      // Go back to user view
      this.selectedPost = null;
      this.postComments = [];
    } else if (this.selectedUser) {
      // Go back to users list
      this.selectedUser = null;
      this.userPosts = [];
    }
  }
}
