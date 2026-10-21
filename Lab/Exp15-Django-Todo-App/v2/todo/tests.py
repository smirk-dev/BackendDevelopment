from django.apps import apps
from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.staticfiles import finders
from django.test import Client, TestCase
from django.urls import reverse

from .admin import TaskAdmin
from .models import Task


class TaskModelTests(TestCase):
    def test_defaults_and_str(self):
        task = Task.objects.create(title='Write lab report')
        self.assertFalse(task.completed)
        self.assertIsNotNone(task.created_at)
        self.assertEqual(str(task), 'Write lab report')

    def test_big_auto_field_from_app_config(self):
        self.assertEqual(Task._meta.pk.get_internal_type(), 'BigAutoField')
        self.assertEqual(apps.get_app_config('todo').verbose_name, 'To-Do Tasks')


class ReadTests(TestCase):
    def test_empty_list_has_helpful_message(self):
        response = self.client.get(reverse('task_list'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'No tasks yet. Add your first task.')

    def test_list_is_newest_first(self):
        Task.objects.create(title='first')
        Task.objects.create(title='second')
        response = self.client.get(reverse('task_list'))
        self.assertEqual([t.title for t in response.context['tasks']], ['second', 'first'])

    def test_completed_task_has_completed_class_and_button_label(self):
        Task.objects.create(title='Done', completed=True)
        Task.objects.create(title='Open')
        response = self.client.get(reverse('task_list'))
        self.assertContains(response, 'class="completed"')
        self.assertContains(response, 'Mark incomplete')
        self.assertContains(response, 'Mark complete')

    def test_every_post_form_has_csrf_token(self):
        Task.objects.create(title='a')
        Task.objects.create(title='b')
        body = self.client.get(reverse('task_list')).content.decode()
        self.assertEqual(body.count('method="post"'), 4)
        self.assertEqual(body.count('name="csrfmiddlewaretoken"'), 4)


class CreateTests(TestCase):
    def test_get_renders_form(self):
        response = self.client.get(reverse('add_task'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'maxlength="200"')
        self.assertContains(response, 'csrfmiddlewaretoken')

    def test_post_creates_stripped_title_and_redirects(self):
        response = self.client.post(reverse('add_task'), {'title': '   Buy milk  '})
        self.assertRedirects(response, reverse('task_list'))
        self.assertEqual(Task.objects.get().title, 'Buy milk')

    def test_whitespace_only_title_is_ignored(self):
        self.client.post(reverse('add_task'), {'title': '    '})
        self.client.post(reverse('add_task'), {})
        self.assertEqual(Task.objects.count(), 0)

    def test_csrf_is_enforced(self):
        strict = Client(enforce_csrf_checks=True)
        response = strict.post(reverse('add_task'), {'title': 'no token'})
        self.assertEqual(response.status_code, 403)
        self.assertEqual(Task.objects.count(), 0)


class UpdateTests(TestCase):
    def test_toggle_flips_both_ways(self):
        task = Task.objects.create(title='Toggle me')
        response = self.client.post(reverse('toggle_task', args=[task.pk]))
        self.assertRedirects(response, reverse('task_list'))
        task.refresh_from_db()
        self.assertTrue(task.completed)
        self.client.post(reverse('toggle_task', args=[task.pk]))
        task.refresh_from_db()
        self.assertFalse(task.completed)

    def test_toggle_rejects_get(self):
        task = Task.objects.create(title='Safe from links')
        response = self.client.get(reverse('toggle_task', args=[task.pk]))
        self.assertEqual(response.status_code, 405)
        task.refresh_from_db()
        self.assertFalse(task.completed)

    def test_toggle_missing_is_404(self):
        self.assertEqual(self.client.post(reverse('toggle_task', args=[999])).status_code, 404)


class DeleteTests(TestCase):
    def test_delete_removes_row(self):
        task = Task.objects.create(title='Delete me')
        response = self.client.post(reverse('delete_task', args=[task.pk]))
        self.assertRedirects(response, reverse('task_list'))
        self.assertFalse(Task.objects.filter(pk=task.pk).exists())

    def test_delete_rejects_get(self):
        task = Task.objects.create(title='Still here')
        self.assertEqual(self.client.get(reverse('delete_task', args=[task.pk])).status_code, 405)
        self.assertTrue(Task.objects.filter(pk=task.pk).exists())

    def test_delete_missing_is_404(self):
        self.assertEqual(self.client.post(reverse('delete_task', args=[999])).status_code, 404)


class TemplateTests(TestCase):
    def test_both_pages_extend_base_and_include_header_footer(self):
        for name in ('task_list', 'add_task'):
            response = self.client.get(reverse(name))
            for template in ('todo/base.html', 'todo/header.html', 'todo/footer.html'):
                self.assertTemplateUsed(response, template)

    def test_page_titles_come_from_child_blocks(self):
        self.assertContains(self.client.get(reverse('task_list')), '<title>My Tasks | Task Tracker</title>')
        self.assertContains(self.client.get(reverse('add_task')), '<title>Add Task | Task Tracker</title>')

    def test_page_specific_blocks(self):
        add_page = self.client.get(reverse('add_task'))
        self.assertContains(add_page, '/static/todo/css/add_task.css')
        self.assertContains(add_page, '/static/todo/js/char_count.js')
        list_page = self.client.get(reverse('task_list'))
        self.assertContains(list_page, '/static/todo/js/confirm-delete.js')
        self.assertNotContains(list_page, 'char_count.js')

    def test_header_logo_has_alt_text(self):
        response = self.client.get(reverse('task_list'))
        self.assertContains(response, 'src="/static/todo/images/logo.png"')
        self.assertContains(response, 'alt="Task Tracker logo"')


class StaticFilesTests(TestCase):
    def test_all_assets_are_discoverable(self):
        for path in ('todo/css/style.css', 'todo/css/add_task.css', 'todo/js/app.js',
                     'todo/js/char_count.js', 'todo/js/confirm-delete.js', 'todo/images/logo.png'):
            self.assertIsNotNone(finders.find(path), path)


class AdminTests(TestCase):
    def setUp(self):
        User.objects.create_superuser('admin', 'admin@example.com', 'pass12345')
        self.client.login(username='admin', password='pass12345')
        Task.objects.create(title='Read chapter 4')
        Task.objects.create(title='Submit lab', completed=True)

    def test_model_admin_configuration(self):
        model_admin = admin.site._registry[Task]
        self.assertIsInstance(model_admin, TaskAdmin)
        self.assertEqual(model_admin.list_display, ('title', 'completed', 'created_at'))
        self.assertEqual(model_admin.list_filter, ('completed',))
        self.assertEqual(model_admin.search_fields, ('title',))
        self.assertEqual(model_admin.list_editable, ('completed',))

    def test_changelist_search_and_filter(self):
        url = '/admin/todo/task/'
        self.assertContains(self.client.get(url), 'To-Do Tasks')
        searched = self.client.get(url, {'q': 'chapter'})
        self.assertContains(searched, 'Read chapter 4')
        self.assertNotContains(searched, 'Submit lab')
        filtered = self.client.get(url, {'completed__exact': '1'})
        self.assertContains(filtered, 'Submit lab')
        self.assertNotContains(filtered, 'Read chapter 4')

    def test_anonymous_user_is_redirected_to_login(self):
        self.client.logout()
        response = self.client.get('/admin/todo/task/')
        self.assertEqual(response.status_code, 302)
        self.assertIn('/admin/login/', response['Location'])
