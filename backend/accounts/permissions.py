from rest_framework import permissions

class HasGroupPermission(permissions.BasePermission):
    """
    Checks if a user belongs to one of the required groups.
    The view should define 'required_groups' as either:
      - a list of group name strings (applies to all methods), or
      - a dict mapping HTTP methods to lists of group name strings.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Let superusers bypass
        if request.user.is_superuser:
            return True

        required_groups = getattr(view, 'required_groups', [])

        if not required_groups:
            return True

        # Support dict-based per-method group requirements
        if isinstance(required_groups, dict):
            method = request.method
            groups_for_method = required_groups.get(method, [])
            if not groups_for_method:
                return True
            return request.user.groups.filter(name__in=groups_for_method).exists()

        # Simple list-based check
        return request.user.groups.filter(name__in=required_groups).exists()
