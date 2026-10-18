from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse

from .models import Task


class TaskModelTests(TestCase):
    def test_defaults_and_str(self):
        task = Task.objects.create(title='Write lab report')
        self.assertFalse(task.completed)
        self.assertIsNotNone(task.created_at)
        self.assertEqual(str(task), 'Write lab report')


class TaskViewTests(TestCase):
    def test_empty_list_message(self):
        response = self.client.get(reverse('task_list'))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'todo/task_list.html')
        self.assertContains(response, 'No tasks yet.')

    def test_list_is_newest_first(self):
        Task.objects.create(title='first')
        Task.objects.create(title='second')
        response = self.client.get(reverse('task_list'))
        self.assertEqual([t.title for t in response.context['tasks']], ['second', 'first'])

    def test_add_form_renders_with_csrf_token(self):
        response = self.client.get(reverse('add_task'))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'todo/add_task.html')
        self.assertContains(response, 'csrfmiddlewaretoken')

    def test_add_creates_task_and_redirects(self):
        response = self.client.post(reverse('add_task'), {'title': 'Buy milk'})
        self.assertRedirects(response, reverse('task_list'))
        self.assertEqual(Task.objects.get().title, 'Buy milk')

    def test_add_with_empty_title_creates_nothing(self):
        response = self.client.post(reverse('add_task'), {'title': ''})
        self.assertRedirects(response, reverse('task_list'))
        self.assertEqual(Task.objects.count(), 0)

    def test_toggle_flips_completed_both_ways(self):
        task = Task.objects.create(title='Toggle me')
        self.client.get(reverse('toggle_task', args=[task.id]))
        task.refresh_from_db()
        self.assertTrue(task.completed)
        response = self.client.get(reverse('toggle_task', args=[task.id]))
        self.assertRedirects(response, reverse('task_list'))
        task.refresh_from_db()
        self.assertFalse(task.completed)

    def test_completed_task_is_struck_through(self):
        Task.objects.create(title='Done already', completed=True)
        response = self.client.get(reverse('task_list'))
        self.assertContains(response, '<s>Done already</s>', html=True)

    def test_delete_removes_task(self):
        task = Task.objects.create(title='Delete me')
        response = self.client.get(reverse('delete_task', args=[task.id]))
        self.assertRedirects(response, reverse('task_list'))
        self.assertFalse(Task.objects.filter(id=task.id).exists())

    def test_missing_id_raises_does_not_exist(self):
        # v1 uses Task.objects.get(), so an unknown id is an unhandled exception (HTTP 500).
        # v2 replaces this with get_object_or_404().
        with self.assertRaises(Task.DoesNotExist):
            self.client.get(reverse('toggle_task', args=[999]))
        with self.assertRaises(Task.DoesNotExist):
            self.client.get(reverse('delete_task', args=[999]))

    def test_csrf_is_enforced_on_add(self):
        from django.test import Client
        strict = Client(enforce_csrf_checks=True)
        response = strict.post(reverse('add_task'), {'title': 'no token'})
        self.assertEqual(response.status_code, 403)
        self.assertEqual(Task.objects.count(), 0)


class LabAssignmentTests(TestCase):
    """Lab Assignment: static directory + extends/include."""

    def test_pages_extend_base_and_include_partials(self):
        for name in ('task_list', 'add_task'):
            response = self.client.get(reverse(name))
            self.assertTemplateUsed(response, 'todo/base.html')
            self.assertTemplateUsed(response, 'todo/partials/header.html')
            self.assertTemplateUsed(response, 'todo/partials/footer.html')

    def test_static_files_are_linked_and_served(self):
        response = self.client.get(reverse('task_list'))
        self.assertContains(response, '/static/todo/css/style.css')
        self.assertContains(response, '/static/todo/js/main.js')
        # The test client bypasses runserver's static handler, so check that the
        # staticfiles finders discover each file (runserver serving is curl-checked in README).
        from django.contrib.staticfiles import finders
        for path in ('todo/css/style.css', 'todo/js/main.js'):
            self.assertIsNotNone(finders.find(path), path)

class AdminTests(TestCase):
    def test_task_is_registered_in_admin(self):
        User.objects.create_superuser('admin', 'admin@example.com', 'pass12345')
        self.client.login(username='admin', password='pass12345')
        Task.objects.create(title='Visible in admin')
        response = self.client.get('/admin/todo/task/')
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Visible in admin')
