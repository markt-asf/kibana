/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { set } from '@kbn/safer-lodash-set/fp';
import { cloneDeep } from 'lodash/fp';
import { mount } from 'enzyme';
import React, { useEffect } from 'react';

import type { AppToast } from '.';
import { useStateToaster, ManageGlobalToaster, GlobalToaster, displayErrorToast } from '.';

jest.mock('uuid', () => {
  return {
    v1: jest.fn(() => '27261ae0-0bbb-11ea-b0ea-db767b07ea47'),
    v4: jest.fn(() => '9e1f72a9-7c73-4b7f-a562-09940f7daf4a'),
  };
});

const mockToast: AppToast = {
  color: 'danger',
  id: 'id-super-id',
  iconType: 'alert',
  title: 'Test & Test',
  toastLifeTimeMs: 100,
  text: 'Error 1, Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
};

describe('Toaster', () => {
  describe('Manage Global Toaster Reducer', () => {
    test('we can add a toast in the reducer', () => {
      const AddToaster = () => {
        const [{ toasts }, dispatch] = useStateToaster();
        return (
          <>
            <button
              data-test-subj="add-toast"
              type="button"
              onClick={() => dispatch({ type: 'addToaster', toast: mockToast })}
            />
            {toasts.map((toast) => (
              <span
                data-test-subj={`add-toaster-${toast.id}`}
                key={`add-toaster-${toast.id}`}
              >{`${toast.title} ${toast.text}`}</span>
            ))}
          </>
        );
      };
      const wrapper = mount(
        <ManageGlobalToaster>
          <AddToaster />
        </ManageGlobalToaster>
      );
      wrapper.find('[data-test-subj="add-toast"]').simulate('click');
      expect(wrapper.find('[data-test-subj="add-toaster-id-super-id"]').exists()).toBe(true);
    });
    test('we can delete a toast in the reducer', () => {
      const DeleteToaster = () => {
        const [{ toasts }, dispatch] = useStateToaster();
        useEffect(() => {
          if (toasts.length === 0) {
            dispatch({ type: 'addToaster', toast: mockToast });
          }
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);
        return (
          <>
            <button
              data-test-subj="delete-toast"
              type="button"
              onClick={() => dispatch({ type: 'deleteToaster', id: mockToast.id })}
            />
            {toasts.map((toast) => (
              <span
                data-test-subj={`delete-toaster-${toast.id}`}
                key={`delete-toaster-${toast.id}`}
              >{`${toast.title} ${toast.text}`}</span>
            ))}
          </>
        );
      };
      const wrapper = mount(
        <ManageGlobalToaster>
          <DeleteToaster />
        </ManageGlobalToaster>
      );

      expect(wrapper.find('[data-test-subj="delete-toaster-id-super-id"]').exists()).toBe(true);
      wrapper.find('[data-test-subj="delete-toast"]').simulate('click');
      expect(wrapper.find('[data-test-subj="delete-toaster-id-super-id"]').exists()).toBe(false);
    });
  });

  describe('Global Toaster', () => {
    test('Render a basic toaster', () => {
      const AddToaster = () => {
        const [{ toasts }, dispatch] = useStateToaster();
        return (
          <>
            <button
              data-test-subj="add-toast"
              type="button"
              onClick={() => dispatch({ type: 'addToaster', toast: mockToast })}
            />
            {toasts.map((toast) => (
              <span key={`add-toaster-${toast.id}`}>{`${toast.title} ${toast.text}`}</span>
            ))}
          </>
        );
      };
      const wrapper = mount(
        <ManageGlobalToaster>
          <AddToaster />
          <GlobalToaster />
        </ManageGlobalToaster>
      );
      wrapper.find('[data-test-subj="add-toast"]').simulate('click');

      expect(wrapper.find('.euiGlobalToastList').exists()).toBe(true);
      expect(wrapper.find('.euiToastHeader__title').text()).toBe('Test & Test');
    });

    test('Render an error toaster', () => {
      let mockErrorToast: AppToast = cloneDeep(mockToast);
      mockErrorToast.title = 'Test & Test ERROR';
      mockErrorToast = set('errors', [mockErrorToast.text], mockErrorToast);

      const AddToaster = () => {
        const [{ toasts }, dispatch] = useStateToaster();
        return (
          <>
            <button
              data-test-subj="add-toast"
              type="button"
              onClick={() => dispatch({ type: 'addToaster', toast: mockErrorToast })}
            />
            {toasts.map((toast) => (
              <span key={`add-toaster-${toast.id}`}>{`${toast.title} ${toast.text}`}</span>
            ))}
          </>
        );
      };
      const wrapper = mount(
        <ManageGlobalToaster>
          <AddToaster />
          <GlobalToaster />
        </ManageGlobalToaster>
      );
      wrapper.find('[data-test-subj="add-toast"]').simulate('click');

      expect(wrapper.find('.euiGlobalToastList').exists()).toBe(true);
      expect(wrapper.find('.euiToastHeader__title').text()).toBe('Test & Test ERROR');
      expect(wrapper.find('button[data-test-subj="toaster-show-all-error-modal"]').exists()).toBe(
        true
      );
    });

    test('Only show one toast at the time', () => {
      const mockOneMoreToast: AppToast = cloneDeep(mockToast);
      mockOneMoreToast.id = 'id-super-id-II';
      mockOneMoreToast.title = 'Test & Test II';

      const AddToaster = () => {
        const [{ toasts }, dispatch] = useStateToaster();
        return (
          <>
            <button
              data-test-subj="add-toast"
              type="button"
              onClick={() => {
                dispatch({ type: 'addToaster', toast: mockToast });
                dispatch({ type: 'addToaster', toast: mockOneMoreToast });
              }}
            />
            <button
              data-test-subj="delete-toast"
              type="button"
              onClick={() => {
                dispatch({ type: 'deleteToaster', id: mockToast.id });
              }}
            />
            {toasts.map((toast) => (
              <span key={`add-toaster-${toast.id}`}>{`${toast.title} ${toast.text}`}</span>
            ))}
          </>
        );
      };
      const wrapper = mount(
        <ManageGlobalToaster>
          <AddToaster />
          <GlobalToaster />
        </ManageGlobalToaster>
      );
      wrapper.find('[data-test-subj="add-toast"]').simulate('click');

      expect(wrapper.find('button[data-test-subj="toastCloseButton"]').length).toBe(1);
      expect(wrapper.find('.euiToastHeader__title').text()).toBe('Test & Test');
      wrapper.find('button[data-test-subj="delete-toast"]').simulate('click');
      expect(wrapper.find('.euiToast').length).toBe(1);
      expect(wrapper.find('.euiToastHeader__title').text()).toBe('Test & Test II');
    });

    test('Do not show anymore toaster when modal error is open', () => {
      let mockErrorToast: AppToast = cloneDeep(mockToast);
      mockErrorToast.id = 'id-super-id-error';
      mockErrorToast = set('errors', [mockErrorToast.text], mockErrorToast);

      const AddToaster = () => {
        const [{ toasts }, dispatch] = useStateToaster();
        return (
          <>
            <button
              data-test-subj="add-toast"
              type="button"
              onClick={() => {
                dispatch({ type: 'addToaster', toast: mockErrorToast });
                dispatch({ type: 'addToaster', toast: mockToast });
              }}
            />
            {toasts.map((toast) => (
              <span key={`add-toaster-${toast.id}`}>{`${toast.title} ${toast.text}`}</span>
            ))}
          </>
        );
      };
      const wrapper = mount(
        <ManageGlobalToaster>
          <AddToaster />
          <GlobalToaster />
        </ManageGlobalToaster>
      );
      wrapper.find('[data-test-subj="add-toast"]').simulate('click');
      wrapper.find('button[data-test-subj="toaster-show-all-error-modal"]').simulate('click');

      expect(wrapper.find('.euiToast').length).toBe(0);
    });

    test('Show new toaster when modal error is closing', () => {
      let mockErrorToast: AppToast = cloneDeep(mockToast);
      mockErrorToast.title = 'Test & Test II';
      mockErrorToast.id = 'id-super-id-error';
      mockErrorToast = set('errors', [mockErrorToast.text], mockErrorToast);

      const AddToaster = () => {
        const [{ toasts }, dispatch] = useStateToaster();
        return (
          <>
            <button
              data-test-subj="add-toast"
              type="button"
              onClick={() => {
                dispatch({ type: 'addToaster', toast: mockErrorToast });
                dispatch({ type: 'addToaster', toast: mockToast });
              }}
            />
            {toasts.map((toast) => (
              <span key={`add-toaster-${toast.id}`}>{`${toast.title} ${toast.text}`}</span>
            ))}
          </>
        );
      };
      const wrapper = mount(
        <ManageGlobalToaster>
          <AddToaster />
          <GlobalToaster />
        </ManageGlobalToaster>
      );
      wrapper.find('[data-test-subj="add-toast"]').simulate('click');
      expect(wrapper.find('.euiToastHeader__title').text()).toBe('Test & Test II');

      wrapper.find('button[data-test-subj="toaster-show-all-error-modal"]').simulate('click');
      expect(wrapper.find('.euiToast').length).toBe(0);

      wrapper.find('button[data-test-subj="modal-all-errors-close"]').simulate('click');
      expect(wrapper.find('.euiToast').length).toBe(1);
      expect(wrapper.find('.euiToastHeader__title').text()).toBe('Test & Test');
    });
  });

  describe('displayErrorToast', () => {
    test('dispatches toast with correct title and message', () => {
      const mockErrorToast = {
        toast: {
          color: 'danger',
          errors: ['message'],
          iconType: 'alert',
          id: '9e1f72a9-7c73-4b7f-a562-09940f7daf4a',
          title: 'Title',
        },
        type: 'addToaster',
      };
      const dispatchToasterMock = jest.fn();
      displayErrorToast('Title', ['message'], dispatchToasterMock);
      expect(dispatchToasterMock.mock.calls[0][0]).toEqual(mockErrorToast);
    });
  });
});
