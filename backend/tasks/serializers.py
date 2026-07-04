from rest_framework import serializers
from .models import Task, Tag


class TagSerializer(serializers.ModelSerializer):
    """
    Serializer for Tag models.
    """
    class Meta:
        model = Tag
        fields = ('id', 'name')


class TaskSerializer(serializers.ModelSerializer):
    """
    Serializer for Task models.
    Automatically assigns the owner to the current logged-in user.

    Tag handling strategy:
    - READ:  `tags` is a SerializerMethodField → always returns a plain list of strings.
    - WRITE: `tags` is also accepted as input via to_internal_value() override.
      We pop it before parent processing to avoid M2M confusion, then handle it
      in create/update via _save_tags().
    """
    # Read-only output field — SerializerMethodField is always safe; it bypasses
    # DRF's internal field-to-model mapping that was causing ManyRelatedManager errors.
    tags = serializers.SerializerMethodField()
    owner = serializers.ReadOnlyField(source='owner.email')

    class Meta:
        model = Task
        fields = (
            'id', 'title', 'description', 'status', 'priority',
            'due_date', 'tags', 'owner', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'owner', 'created_at', 'updated_at')

    def get_tags(self, obj):
        """Return tags as a plain list of lowercase strings."""
        return [tag.name for tag in obj.tags.all()]

    def to_internal_value(self, data):
        """
        Extract the 'tags' list from incoming data before DRF's field validation
        so the parent Serializer never tries to map it to the M2M relation.
        Store it on the instance for use in create/update.
        """
        # Pull tags out of the mutable copy of data
        mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)
        raw_tags = mutable_data.pop('tags', None)

        ret = super().to_internal_value(mutable_data)

        # Attach raw tags so create/update can access them via validated_data
        if raw_tags is not None:
            if not isinstance(raw_tags, list):
                raise serializers.ValidationError({'tags': 'Expected a list of strings.'})
            for item in raw_tags:
                if not isinstance(item, str):
                    raise serializers.ValidationError({'tags': 'Each tag must be a string.'})
            ret['_tags'] = raw_tags
        return ret

    def validate_title(self, value):
        """
        Ensure title is not empty or consisting only of whitespace.
        """
        if not value or value.strip() == "":
            raise serializers.ValidationError("Title cannot be empty or only whitespace.")
        return value.strip()

    def create(self, validated_data):
        tags_data = validated_data.pop('_tags', [])
        validated_data['owner'] = self.context['request'].user
        task = Task.objects.create(**validated_data)
        self._save_tags(task, tags_data)
        return task

    def update(self, instance, validated_data):
        tags_data = validated_data.pop('_tags', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if tags_data is not None:
            self._save_tags(instance, tags_data)
        return instance

    def _save_tags(self, task, tags_data):
        """
        Sync the task's M2M tags relation with the given list of tag name strings.
        Creates missing Tag rows automatically.
        """
        task.tags.clear()
        for tag_name in tags_data:
            tag_name_clean = tag_name.strip().lower()
            if tag_name_clean:
                tag, _ = Tag.objects.get_or_create(name=tag_name_clean)
                task.tags.add(tag)
