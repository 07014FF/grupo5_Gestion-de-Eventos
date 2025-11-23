// FormContainer.tsx - VERSIÓN OPTIMIZADA SIN LOOPS

import React, { memo } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';

interface FormContainerProps {
  children: React.ReactNode;
  contentContainerStyle?: ViewStyle;
  backgroundColor?: string;
  safeAreaEdges?: Edge[];
}

const FormContainerComponent: React.FC<FormContainerProps> = ({
  children,
  contentContainerStyle,
  backgroundColor = '#0F172A',
  safeAreaEdges = ['top', 'left', 'right'],
}) => {

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor }]}
      edges={safeAreaEdges}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0} // Ajuste para iOS
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.contentContainer,
            contentContainerStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
});

// React.memo previene re-renders innecesarios
const FormContainer = memo(FormContainerComponent);

export default FormContainer;
