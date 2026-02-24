import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';

interface StorageFormProps {
  onSave: (key: string, value: string) => Promise<boolean>;
  onGet: (key: string) => Promise<string | null>;
  onDelete: (key: string) => Promise<boolean>;
  onClearAll?: () => Promise<boolean>;
  retrievedValue?: string;
  allKeys?: string[];
  title: string;
  description: string;
  showClearAll?: boolean;
}

export function StorageForm({
  onSave,
  onGet,
  onDelete,
  onClearAll,
  retrievedValue,
  allKeys,
  title,
  description,
  showClearAll = false,
}: StorageFormProps) {
  const [key, setKey] = useState<string>('');
  const [value, setValue] = useState<string>('');

  const handleSave = async () => {
    const success = await onSave(key, value);
    if (success) {
      setKey('');
      setValue('');
    }
  };

  const handleGet = async () => {
    await onGet(key);
  };

  const handleDelete = async () => {
    await onDelete(key);
  };

  return (
    <ScrollView className="flex-1 px-6 py-8">
      <Text variant="heading" size="2xl" className="mb-2">{title}</Text>
      <Text variant="body" color="secondary" className="mb-6">{description}</Text>

      <View className="space-y-4 mb-6">
        <Input
          label="Key:"
          placeholder="Enter key"
          value={key}
          onChangeText={setKey}
          autoCapitalize="none"
        />

        <Input
          label="Value:"
          placeholder="Enter value"
          value={value}
          onChangeText={setValue}
          autoCapitalize="none"
          secureTextEntry={title.includes('Secure')}
        />
      </View>

      <View className="space-y-3 mb-6">
        <Button variant="primary" onPress={handleSave}>
          Save {title.includes('Secure') ? 'Secure ' : ''}Data
        </Button>

        <Button variant="success" onPress={handleGet}>
          Retrieve {title.includes('Secure') ? 'Secure ' : ''}Data
        </Button>

        <Button variant="danger" onPress={handleDelete}>
          Delete {title.includes('Secure') ? 'Secure ' : ''}Data
        </Button>

        {showClearAll && onClearAll && (
          <Button variant="secondary" onPress={onClearAll}>
            Clear All Data
          </Button>
        )}
      </View>

      {retrievedValue ? (
        <Card className="mb-4">
          <Text variant="label" className="mb-2">
            Retrieved Value:
          </Text>
          <Text>{retrievedValue}</Text>
        </Card>
      ) : null}

      {allKeys && allKeys.length > 0 && (
        <Card>
          <Text variant="label" className="mb-2">
            All Stored Keys:
          </Text>
          {allKeys.map((storedKey, index) => (
            <Text key={index}>
              • {storedKey}
            </Text>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}
