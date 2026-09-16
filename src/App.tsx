/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Editor from './Editor'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/project/:projectId" element={<Editor />} />
        <Route path="*" element={<Editor />} />
      </Routes>
    </BrowserRouter>
  )
}
